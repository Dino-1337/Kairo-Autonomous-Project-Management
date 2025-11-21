import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI understand my project requirements?",
    answer: "Our AI is trained on thousands of real projects and uses natural language processing to break down your requirements into actionable tasks, time estimates, and skill requirements.",
  },
  {
    question: "Can I customize how tasks are assigned?",
    answer: "Absolutely! You can set preferred assignees, skill requirements, and approval workflows. The AI suggestions are starting points that you can always adjust.",
  },
  {
    question: "What integrations do you support?",
    answer: "We integrate with Slack for notifications, export to PDF/CSV, and offer API access for custom integrations. Enterprise plans include custom integration support.",
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We use enterprise-grade encryption, SOC 2 compliance, and never train our AI on your private project data. Your information is yours alone.",
  },
  {
    question: "Can I try before upgrading to Pro?",
    answer: "Yes! Our Free plan is fully functional for small teams. Pro offers a 14-day free trial with no credit card required.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-24 px-6">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">
          Frequently <span className="text-primary font-normal">asked questions</span>
        </h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="glass-card px-6 border-none animate-scroll-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AccordionTrigger className="text-left font-normal hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/70 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
