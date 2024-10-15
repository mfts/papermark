import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Flag } from "lucide-react"
import { toast } from "sonner"


export default function ReportForm({ linkId, documentId, viewId }: { linkId: string | undefined, documentId: string | undefined, viewId: string | undefined }) {
    const [abuseType, setAbuseType] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    enum AbuseTypeEnum {
        "spam" = 1,
        "malware" = 2,
        "copyright" = 3,
        "harmful" = 4,
        "not-working" = 5,
        "other" = 6,
    }

    const handleSubmit = async () => {
        if (!abuseType) {
            toast.error("Please select an abuse type.");
            return;
        }

        const abuseTypeEnum = AbuseTypeEnum[abuseType as keyof typeof AbuseTypeEnum]; // Convert string to enum number

        const response = await fetch("/api/report", {
            method: "POST",
            body: JSON.stringify({
                linkId: linkId,
                documentId: documentId,
                viewId: viewId,
                abuseType: abuseTypeEnum // Send the numeric value of the abuse type
            }),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const { message } = await response.json();
            toast.error(message);
            return;
        }

        toast.success("Report submitted successfully");
        setIsDialogOpen(false);
    };


    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button
                    className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                    size="icon"
                    title="Report abuse"
                >
                    <Flag className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription>
                        What kind of issue would you like to report? Please select the most appropriate option.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <RadioGroup onValueChange={setAbuseType} className="grid gap-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="spam" id="spam" />
                            <Label htmlFor="spam">Spam, Fraud, or Scam</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="malware" id="malware" />
                            <Label htmlFor="malware">Malware or virus</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="copyright" id="copyright" />
                            <Label htmlFor="copyright">Copyright violation</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="harmful" id="harmful" />
                            <Label htmlFor="harmful">Harmful content</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="not-working" id="not-working" />
                            <Label htmlFor="not-working">Content is not working properly</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="other" id="other" />
                            <Label htmlFor="other">Other</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={!abuseType}>Submit Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}