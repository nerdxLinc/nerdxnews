import { useState, useEffect } from 'react'
import './App.css'

const portfolioItems = [
  { id: 1, title: 'Cilantros Mexican Grill', category: 'signs', image: 'https://masterstouchsigns.com/img/portfolio/cilantros.jpg', description: 'Complete branding: Logo Design, Channel Letters, Graphics, Banners' },
  { id: 2, title: 'Conway Marble & Granite', category: 'wraps', image: 'https://masterstouchsigns.com/img/portfolio/CMG.jpg', description: 'Complete Logo Design and Vehicle wrap' },
  { id: 3, title: 'Brandon Moving & Storage', category: 'wraps', image: 'https://masterstouchsigns.com/img/portfolio/brandon1.jpg', description: 'Complete truck box wraps for moving company fleet' },
  { id: 4, title: 'Gravette Police Department', category: 'wraps', image: 'https://masterstouchsigns.com/img/portfolio/gpd.jpg', description: 'Complete redesign and upgrade for police vehicles' },
  { id: 5, title: 'Dr. Leona Kemper', category: 'signs', image: 'https://masterstouchsigns.com/img/portfolio/Dr%20Leona%20Kemper.jpg', description: 'Hand cut layered MDO with gold leaf materials' },
  { id: 6, title: 'Wilcox Contracting', category: 'logos', image: 'https://masterstouchsigns.com/img/portfolio/wilcox.jpg', description: 'Logo Design, cards and vehicle graphics' },
  { id: 7, title: "Cindy's Sweet Shoppe", category: 'signs', image: "https://masterstouchsigns.com/img/portfolio/Cindy's%20Sweet%20Shoppe.jpg", description: 'Digitally printed storefront signage' },
  { id: 8, title: 'Nixon Guide Service', category: 'logos', image: 'https://masterstouchsigns.com/img/portfolio/fishin.jpg', description: 'Logo Design and business cards' },
]

const testimonials = [
  { name: 'Kaye Lynn Wilcox', company: 'Wilcox Contracting, LLC', location: 'Scott, AR', text: "Masters Touch has played a vital part in my businesses since 2008. Logo designs, truck lettering, store front signage, business cards, Websites... I trust no one else with my print and web image!" },
  { name: 'Tom Elliott', company: 'Springfield Wagon Company', location: 'Clinton, AR', text: "Barry never ceases to amaze me with his creativity and talent. He has always been able to replicate vintage fonts for our horse drawn wagon restorations. I would highly recommend him." },
  { name: 'Justin K. Redman', company: 'Contractor and Industrial Resources', location: 'Bryant, AR', text: "The results were spectacular. He took my bland idea and transformed it into a fresh, modern statement. My vehicle looks like a mobile billboard. Master's Touch opened a lot of doors for me." },
]

const services = [
  { icon: '✦', title: 'Signs & Lettering', description: 'From simple directionals to complex illuminated channel letters. Quality materials for durable, professional results.' },
  { icon: '🚗', title: 'Vehicle Wraps', description: 'Transform your fleet into mobile billboards. Full wraps, partial wraps, and precision graphics.' },
  { icon: '🎨', title: 'Logo Design', description: 'A great logo gets attention and makes lasting impressions. We create identities that stand out.' },
  { icon: '🖨️', title: 'Printing', description: 'Business cards, banners, promotional materials. Print media that lifts your presence above the rest.' },
]

function App() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isLogoLoaded, setIsLogoLoaded] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const filteredPortfolio = activeCategory === 'all' 
    ? portfolioItems 
    : portfolioItems.filter(item => item.category === activeCategory)

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <a href="#home" className="nav-logo">
            <span className="chrome-text">MTD</span>
          </a>
          <div className="nav-links">
            <a href="#portfolio">Portfolio</a>
            <a href="#services">Services</a>
            <a href="#about">About</a>
            <a href="#contact" className="nav-cta">Get Quote</a>
          </div>
        </div>
      </nav>

      <section id="home" className="hero">
        <div className="hero-bg-effects">
          <div className="grid-overlay"></div>
          <div className="glow-orb orb-1"></div>
          <div className="glow-orb orb-2"></div>
        </div>
        
        <div className="hero-content">
          <div className={`logo-container ${isLogoLoaded ? 'loaded' : ''}`}>
            <img 
              src="/assets/logo.png" 
              alt="MTD Signs & Graphics" 
              className="hero-logo"
              onLoad={() => setIsLogoLoaded(true)}
            />
            <div className="logo-ring"></div>
          </div>
          
          <h1 className="hero-tagline">
            Signs of Excellence Since 1994
          </h1>
          
          <p className="hero-subtitle">
            Custom Signs, Vehicle Wraps & Graphics
          </p>
          
          <div className="hero-cta">
            <button className="btn-primary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              Request Free Quote
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}>
              View Our Work
            </button>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <span>Scroll to Explore</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      <section id="portfolio" className="portfolio section">
        <p className="imagine-text">Imagine the Possibilities...</p>
        <h2 className="section-title">
          <span className="chrome-text">Our Portfolio</span>
        </h2>
        <p className="section-subtitle">30+ Years of Excellence in Every Project</p>
        
        <div className="portfolio-filters">
          {['all', 'signs', 'wraps', 'logos', 'print'].map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="portfolio-grid">
          {filteredPortfolio.map(item => (
            <div key={item.id} className="portfolio-card">
              <div className="card-image">
                <img src={item.image} alt={item.title} loading="lazy" />
                <div className="card-overlay">
                  <span className="card-category">{item.category}</span>
                </div>
              </div>
              <div className="card-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="services section">
        <h2 className="section-title">
          <span className="chrome-text">What We Do</span>
        </h2>
        <p className="section-subtitle">Comprehensive Design & Signage Solutions</p>
        
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="testimonials section">
        <h2 className="section-title">
          <span className="chrome-text">Client Stories</span>
        </h2>
        
        <div className="testimonial-carousel">
          <div className="testimonial-card">
            <div className="quote-mark">"</div>
            <p className="testimonial-text">{testimonials[currentTestimonial].text}</p>
            <div className="testimonial-author">
              <strong>{testimonials[currentTestimonial].name}</strong>
              <span>{testimonials[currentTestimonial].company}</span>
              <span className="location">{testimonials[currentTestimonial].location}</span>
            </div>
          </div>
          
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button 
                key={i} 
                className={`dot ${i === currentTestimonial ? 'active' : ''}`}
                onClick={() => setCurrentTestimonial(i)}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="about section">
        <div className="about-content">
          <div className="about-text">
            <h2 className="section-title">
              <span className="chrome-text">About MTD</span>
            </h2>
            <p>With over <strong>30 years</strong> in the design industry, Barry Branscum brings both fine art training and graphic design expertise to every project.</p>
            <p>What sets us apart is our commitment to <strong>design-first thinking</strong>. Anyone can cut letters with a machine, but it takes artistry to create advertising that truly works.</p>
            <ul className="skills-list">
              <li>Award-winning designer</li>
              <li>Featured in major trade publications</li>
              <li>Custom fabrication & installation</li>
              <li>Full-service from concept to completion</li>
            </ul>
          </div>
          <div className="about-image">
            <div className="experience-badge">
              <span className="years">30+</span>
              <span className="label">Years Experience</span>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="contact section">
        <div className="contact-wrapper">
          <div className="contact-info">
            <h2 className="section-title">
              <span className="chrome-text">Let's Create</span>
            </h2>
            <p>Ready to make your business stand out? Get in touch for a free consultation.</p>
            
            <div className="contact-details">
              <div className="contact-item">
                <span className="icon">📍</span>
                <div>
                  <strong>Location</strong>
                  <p>166 Hwy 310, Enola, AR 72047</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="icon">📞</span>
                <div>
                  <strong>Phone</strong>
                  <p>501-329-1111</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="icon">✉️</span>
                <div>
                  <strong>Email</strong>
                  <p>mtdsigns@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <form className="contact-form" onSubmit={(e) => { e.preventDefault(); alert('Form submitted! (Demo)') }}>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <input type="tel" placeholder="Phone Number" />
            <select defaultValue="">
              <option value="" disabled>Project Type</option>
              <option value="signs">Signs & Lettering</option>
              <option value="wraps">Vehicle Wraps</option>
              <option value="logos">Logo Design</option>
              <option value="printing">Printing</option>
              <option value="other">Other</option>
            </select>
            <textarea placeholder="Tell us about your project..." rows={4}></textarea>
            <button type="submit" className="btn-primary">Send Message</button>
          </form>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <img src="/assets/logo.png" alt="MTD Signs" className="footer-logo" />
          <p>Excellence in Sign Design Since 1994</p>
          <p className="copyright">© {new Date().getFullYear()} MTD Signs & Graphics. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
