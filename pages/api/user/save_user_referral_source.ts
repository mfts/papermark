import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from "@/lib/prisma";
import { getSession } from 'next-auth/react';
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse){

    if(req.method=='POST'){

        const body = req.body;

        const session = await getServerSession(req, res, authOptions);
        
        if(!session || !session.user || !session.user.email){
            res.status(401).json({'Error':'Unauthenticated'});
            return;
        }
        try{
            const result = await prisma.user.update({
                where : {
                    email : session?.user?.email
                },
                data : {
                    referralSource : body.referralSource
                }
            });
            if(result){
                return res.status(200).json({'message':'referralSource added successfully'});
            }
        } catch (error) {
            return res.status(400).json({error: "Failed to update record"});
        }
    }
    else{
        return res.status(405).json({ error: "Method not allowed" });
    }
}