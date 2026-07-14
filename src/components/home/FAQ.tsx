import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ShieldAlert, Clock, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    id: "untrusted",
    question: "My eSign shows 'Untrusted' — what should I do?",
    answer:
      "An 'Untrusted' result means the signature itself is mathematically valid, but the signing certificate was not issued by a Certifying Authority (CA) present in our trust store. This can happen with newer sub-CAs or private organisational certificates. If the issuer's root certificate is embedded in the PDF, you can manually add it using the 'Add to Trusted CAs' button on the verification report. Only do this if you are confident the issuer is legitimate.",
    icon: ShieldAlert,
    iconColor: "text-warning",
    borderColor: "border-warning/30",
  },
  {
    id: "expired",
    question: "The signing certificate is expired — is my document still valid?",
    answer:
      "An expired certificate means the signer's digital certificate has passed its validity period. The document may still have been valid at the time it was signed. VeriDoc reports this as 'Expired' to flag that the certificate can no longer be relied upon for current authentication. For legal or compliance purposes, consult the issuing authority or check if the certificate was valid on the date the document was signed.",
    icon: Clock,
    iconColor: "text-warning",
    borderColor: "border-warning/30",
  },
  {
    id: "ca-not-added",
    question: "The CA (Certifying Authority) is not added — how do I fix this?",
    answer:
      "VeriDoc ships with root certificates from all major CCA India licensed Certifying Authorities (eMudhra, CDAC, Capricorn, SafeScrypt, NIC, etc.). If a CA is missing, it may be a sub-CA or a recently licensed authority. You can add the issuer's certificate to your local trust store using the 'Add to Trusted CAs' button that appears when a document shows an 'Untrusted' result. This is a per-session action and does not affect global system trust.",
    icon: AlertTriangle,
    iconColor: "text-warning",
    borderColor: "border-warning/30",
  },
  {
    id: "invalid-signature",
    question: "My PDF shows 'Invalid Signature' — why?",
    answer:
      "An 'Invalid Signature' means the document has been modified after it was digitally signed. The cryptographic hash no longer matches the original signed content. Common causes include adding watermarks, merging with another PDF, compressing, flattening, or re-saving the file. To resolve this, always upload the original, untouched PDF exactly as it was received from the issuer.",
    icon: XCircle,
    iconColor: "text-destructive",
    borderColor: "border-destructive/30",
  },
  {
    id: "verified-meaning",
    question: "What does 'Verified' mean exactly?",
    answer:
      "A 'Verified' result means all checks have passed: the cryptographic signature is mathematically valid, the document has not been tampered with since signing, the signing certificate is within its validity period, and the certificate chains to a trusted Indian Certifying Authority recognised by CCA India. This is the highest confidence result VeriDoc can provide. Note that this is an assistive verification — for legally binding confirmation, use the CA's official validation utility.",
    icon: CheckCircle2,
    iconColor: "text-success",
    borderColor: "border-success/30",
  },
] as const;

export function FAQ() {
  return (
    <section id="faq" className="mt-10 sm:mt-16 scroll-mt-20 border-t border-border/60 pt-10 sm:pt-16">
      <h2 className="text-xl sm:text-2xl">Frequently Asked Questions</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
        Common questions about eSign verification and what to do when things don't go as expected.
      </p>

      <Accordion type="single" collapsible className="mt-6 sm:mt-8 space-y-3">
        {FAQ_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <AccordionItem
              key={item.id}
              value={item.id}
              className={cn(
                "rounded-xl border bg-card/60 px-5 transition-colors hover:bg-card data-[state=open]:bg-card",
                item.borderColor,
              )}
            >
              <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline gap-3">
                <span className="flex items-center gap-3 text-left">
                  <Icon className={cn("h-5 w-5 shrink-0", item.iconColor)} />
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 leading-relaxed pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
