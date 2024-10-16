import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Flag } from "lucide-react"
import { toast } from "sonner"


export default function ReportForm({ linkId, documentId, viewId }: { linkId: string | undefined, documentId: string | undefined, viewId: string | undefined }) {
    const [abuseType, setAbuseType] = useState("")
    const [open, setOpen] = useState(false)

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
        setOpen(false)
    };


    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        className="m-1 bg-gray-900 text-white hover:bg-gray-900/80"
                        size="icon"
                        title="Report abuse"
                    >
                        <Flag className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Report an Issue</h4>
                            <p className="text-sm text-muted-foreground">
                                What kind of issue is it?
                            </p>
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
                            <Button onClick={handleSubmit} disabled={!abuseType}>Submit Report</Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover >
        </>
    )
}
