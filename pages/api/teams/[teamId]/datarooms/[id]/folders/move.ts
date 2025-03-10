import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import slugify from "@sindresorhus/slugify";
import { DataroomFolder, PrismaPromise } from "@prisma/client";

export default async function handle(req:NextApiRequest, res: NextApiResponse){
    
    if (req.method === "PATCH"){
        const {
            isAuthorized,
            isReqBodyValid,
            userTeamCredentials,
            teamDataroomCredentials,
            ids,
            body,
        } = await reqInsight(req, res);

        const {userId, teamId, dataroomId} = ids;

        if (!isAuthorized || !userId){
            return res.status(401).end('Unauthorized')
        };

        if (!teamId){
            return res.status(404).end("TeamId not found")
        };

        if (!dataroomId){
            return res.status(404).end("DataroomId not found")
        }

        if (!isReqBodyValid){
            return res.status(400).end("Request body need to have <folderIds:string[] | string> and <newParentFolderId: string | null> with valid data types")
        };

        let {folderIds, newParentFolderId} = body;

        if (folderIds.length === 0) {
            return res.status(400).end("No folder selected");
        };
    
        if (newParentFolderId && folderIds.includes(newParentFolderId)){
            return res.status(400).end("A Folder cannot be moved into itself");
        };

        const doesUserBelongsToThisTeam = !! await userTeamCredentials();

        
        if (!doesUserBelongsToThisTeam) {
            return res.status(403).end("Forbidden");
        };
        // Now we are sure that user is part of the given team

        const doesThisDataroomBelongsToThisTeam = !! await teamDataroomCredentials();

        if (!doesThisDataroomBelongsToThisTeam){
            return res.status(403).end('Forbidden')
        }
        // Now we are sure that this given data-room belongs to this team
        
        let destinationParentPath : string | undefined;
        let requestedFoldersToBeMoved: DataroomFolder[] = []; // in here we will store folders whose id is in folderIds
        let nameConflict = false; // nameConflict occurs when destination folder's existing child 's name matches with any requested Folder's name

        const destinationParentFolderIsRoot = newParentFolderId === null;
        
        if (destinationParentFolderIsRoot){
            destinationParentPath = "";
            // folders who going to be the neighbors:sibling of requestedFoldersToBeMoved.
            const foldersWhoExistAtRoot = await prisma.dataroomFolder.findMany({
                where: {
                    parentId: null,
                    dataroomId
                }
            });

            // Exclude if folder is already a child of destinationFolder.
            folderIds = folderIds.filter(fId => !foldersWhoExistAtRoot.some(f => f.id === fId))

            requestedFoldersToBeMoved = await prisma.dataroomFolder.findMany({
                where: {
                    id: {in: folderIds},
                    dataroomId
                }
            });

            const requestedFolderNames = Array.from(requestedFoldersToBeMoved, (rFolder) => rFolder.name);
            nameConflict = foldersWhoExistAtRoot.some(newNeighborFolder => requestedFolderNames.includes(newNeighborFolder.name));

        } else {
            // Now we would need to make a extra query to find out the new parent folder
            const destinationFolder = await prisma.dataroomFolder.findUnique({
                where: {
                    id: newParentFolderId,
                    dataroomId
                },
                include: {
                    childFolders: true
                }
            });

            //destinationFolder does not exist.
            if (!destinationFolder){
                return res.status(404).end("Destination folder not found")
            };

            // GOAL of this block is to deal if requested folder is a parent of destination folder (new desired parent folder)
            if (destinationFolder.parentId){ 
                const requestedFolderWhoIsParentOfDestinationFolder = folderIds.find(fId => fId === destinationFolder.parentId);
                if (requestedFolderWhoIsParentOfDestinationFolder){
                    return res.status(400).end(`New desired parent folder <${destinationFolder.name}:${destinationFolder.path}> found to be child of one of the requested folders <ID:${requestedFolderWhoIsParentOfDestinationFolder}>`)
                };
            };

            // If folder already belongs to the destinationParentFolder then exclude it
            folderIds = folderIds.filter(fId => !destinationFolder.childFolders.some(cFolder => cFolder.id === fId));
            // destinationParentPath will be required to assign correct path to folders
            destinationParentPath = destinationFolder.path;

            requestedFoldersToBeMoved = await prisma.dataroomFolder.findMany({
                where: {
                    id: {in: folderIds},
                    dataroomId
                }
            });
            
            const requestedFolderNames = Array.from(requestedFoldersToBeMoved, (rFolder) => rFolder.name);
            nameConflict = destinationFolder.childFolders.some(cFolder => requestedFolderNames.includes(cFolder.name));
        };

        if (nameConflict){
            return res.status(400).end("Folder name conflict has occurred due to matched name of one of the destination folder's existing child.")
        };

        // Goal of this block : To deal if any requested folder is a parent of destination folder (new desired parent folder)
        if (!destinationParentFolderIsRoot){
            const requestedFolderWhoIsParentOfDestinationFolder = requestedFoldersToBeMoved.find(rFolder =>  destinationParentPath.startsWith(rFolder.path));
            if (requestedFolderWhoIsParentOfDestinationFolder){
                return res.status(400).end(`Destination folder <New-Parent-Folder:${destinationParentPath}> found to be a child of <${requestedFolderWhoIsParentOfDestinationFolder.name}:${requestedFolderWhoIsParentOfDestinationFolder.path}>`)
            }
        };

        /**
         * ************************** UPDATE PHASE **************************
         * Tasks to do:
         * 1) For every folder in `requestedFoldersToBeMoved` we need to update:
         *      (i) parent folder's reference
         *      (ii) update path value of folder and entire folder hierarchy.
         *          e.g: oldParentPath/folderPathName ----> newFolderPath/folderPathName,
         *               Even though, after [Step(i)] Parent of the entire folder hierarchy has been changed but also need to be careful about following: 
         *               Also need to do: oldParentPath/folderPathName/childPathName ---> newParentPath/folderPathName/childPathName [:: for every sub-child]
         */


        const foldersRecord : {
            [path:string]: {
                foldersToUpdate:DataroomFolder[],
                // callback Fn which will be called in prisma.$transaction
                callbackFnUpdate: (folderToUpdate:DataroomFolder)=>PrismaPromise<DataroomFolder>
            }
        } = Object.fromEntries(
            Array.from(requestedFoldersToBeMoved, (rFolder) => [
                // key
                rFolder.path,
                // value
                {
                    foldersToUpdate: [rFolder],
                    // Remember this is just the callback which will be executed inside prisma.$transaction.
                    callbackFnUpdate: (folderToUpdate) => {
                        if (!folderToUpdate.path.startsWith(rFolder.path)){
                            // As far i think there would no chance of this statement to occur, but still making sure that we handle it.
                            throw new Error(`${folderToUpdate.name}:${folderToUpdate.path} is not a child of ${rFolder.name}:${rFolder.path}`)
                        }
                        return prisma.dataroomFolder.update({
                            where: {
                                dataroomId_path: {
                                    dataroomId,
                                    path: folderToUpdate.path
                                }
                            },
                            data: {
                                // If folderToUpdate is a subChild folder of requestedFolder then only `path` will be changed otherwise in the case of requestedFolderToBeMoved parentId will also be changed.
                                ...(folderToUpdate.path === rFolder.path && {
                                    parentId: newParentFolderId
                                }),
                                // calculating new path value.
                                path: destinationParentPath + "/" + slugify(rFolder.name) + folderToUpdate.path.substring(rFolder.path.length)
                            }
                        });
                    }
                }
            ])
        );

        //Adding the corresponding child folders in the record.
        for(let path in foldersRecord){
            const subFolders = await prisma.dataroomFolder.findMany({
                where: {
                    path: {
                        // used '/' at the end so that it will not fetch folders that we already have in folderRecord[path] means i will not refetch the `requestedFoldersToBeMoved`
                        startsWith: path + "/"
                    },
                    dataroomId,
                },
            });
            foldersRecord[path].foldersToUpdate.push(...subFolders);
        };

        try {

            const updatedFolders = await prisma.$transaction(
                Object.values(foldersRecord).map(
                    ({foldersToUpdate, callbackFnUpdate}) => {
                        return foldersToUpdate.map(callbackFnUpdate)
                    }
                ).flat()
            );

            if (updatedFolders.length === 0){
                return res.status(404).end("No folders were moved");
            };
    
            return res.status(200).json({
                message: "Folder moved successfully",
                // count of folders whose path and parent reference has been changed
                updatedCount: requestedFoldersToBeMoved.length,
                // total count includes child folders whose path has got updated
                updatedTotalCount: updatedFolders.length,
                // leading path of new parent
                pathOfNewParent: destinationParentPath,
            });
        } catch {
            return res.status(500).end("Oops! Failed to perform the DB transaction to move the folder location")
        }
    } else {
        res.setHeader("Allow", ["PATCH"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}


async function reqInsight(req:NextApiRequest, res: NextApiResponse){
    const session = await getServerSession(req, res, authOptions);
    const isAuthorized= !!session;

    // By default we assume req body is not valid
    let isReqBodyValid = false;

    
    let {folderIds, newParentFolderId} = req.body as {
        folderIds: string[] | string,
        newParentFolderId: string | null 
    };

    if (typeof folderIds === 'string'){
        // In the api we prefer to handle it only as string-array for consistency.
        folderIds = [folderIds]
    };

    if (
        Array.isArray(folderIds) 
        && folderIds.every(f => typeof f === 'string') 
        && (newParentFolderId === null || typeof newParentFolderId === 'string')
    ){
        isReqBodyValid = true;
        //Ensure that there is no duplicate folderIds.
        folderIds = Array.from(new Set(folderIds))
    };

    const ids = {
        teamId: req.query?.teamId as undefined | string,
        dataroomId: req.query?.id as undefined | string,
        userId: isAuthorized ? (session.user as CustomUser)?.id : undefined
    }

    const userTeamCredentials = async () => {
        const {teamId , userId} = ids;
        if (teamId && userId){
            return await prisma.userTeam.findUnique({
                where: {
                    userId_teamId:{userId, teamId}
                }
            });
        };
        return null
    };

    const teamDataroomCredentials = async () => {
        const {teamId, dataroomId} = ids;
        if (teamId && dataroomId){
            return await prisma.dataroom.findUnique({
                where: {
                    id: dataroomId,
                    teamId
                }
            })
        };
        return null
    }

    return {
        isAuthorized,
        session,
        isReqBodyValid,
        ids,
        userTeamCredentials,
        teamDataroomCredentials,
        body: {
            folderIds,
            newParentFolderId
        }
    }
}