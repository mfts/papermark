import { CheckCircle, Clock, XCircle } from "lucide-react";

import { DocumentApprovalStatus } from "@prisma/client";
import { Badge } from "../ui/badge";

export const ApprovalStatusBadge = ({
    status,
}: {
    status: DocumentApprovalStatus | null;
}) => {
    switch (status) {
        case "APPROVED":
            return (
                <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                </Badge>
            );
        case "PENDING":
            return (
                <Badge variant="outline" className="flex items-center gap-2 cursor-not-allowed">
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>
            );
        case "REJECTED":
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Rejected
                </Badge>
            );
        default:
            return null;
    }
};