import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Cut our project planning time from days to minutes. Game changer for our team.",
    author: "Sarah Chen",
    role: "Product Manager at TechCorp",
    rating: 5,
  },
  {
    quote: "The AI accurately breaks down complex projects. Our velocity increased 40%.",
    author: "Michael Rodriguez",
    role: "Engineering Lead at StartupXYZ",
    rating: 5,
  },
  {
    quote: "Finally, a project management tool that understands natural language.",
    author: "Emily Watson",
    role: "CEO at DesignHub",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="container mx-auto">
        <h2 className="text-4xl md:text-5xl font-light text-center mb-16 tracking-tight">
          Loved by <span className="text-primary font-normal">teams worldwide</span>
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass-card p-8 hover:shadow-xl transition-all duration-300 animate-scroll-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>
              
              <p className="text-foreground/80 mb-6 leading-relaxed">"{testimonial.quote}"</p>
              
              <div>
                <p className="font-normal">{testimonial.author}</p>
                <p className="text-sm text-foreground/60">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
