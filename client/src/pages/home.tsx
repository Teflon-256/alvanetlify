import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChartLine, Link, Bot, Users, Shield, Headphones, TrendingUp, Zap, DollarSign } from "lucide-react";
// Remove problematic image import
// If the image exists, ensure it's in client/src/generated_images/ and uncomment with correct path
// import futuristicStockExchange from "@/generated_images/Futuristic_stock_exchange_wallpaper_8045bc0a.png";

export default function Home() {
  const handleGetStarted = () => {
    window.location.href = '/.netlify/functions/index/api/login';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <ChartLine className="text-white h-4 w-4" />
              </div>
              <span className="text-xl font-serif font-bold gradient-text" data-testid="logo-text">AlvaCapital</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-features">Features</a>
              <a href="#about" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-about">About</a>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors" data-testid="nav-contact">Contact</a>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleGetStarted} 
                className="text-muted-foreground hover:text-primary"
                data-testid="nav-signin"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleGetStarted} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="nav-get-started"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          // Remove backgroundImage if image is missing
          // style={{
          //   backgroundImage: `url(${futuristicStockExchange})`,
          // }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/80 to-background/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(0_0%_98%/0.1)_0%,transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-6" data-testid="hero-title">
                Alva Capital
                <span className="gradient-text block">Account Management</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="hero-description">
                Connect your trading accounts to our master copier system, track performance, and earn through our exclusive referral program. Experience premium capital management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  onClick={handleGetStarted} 
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105"
                  data-testid="hero-start-trading"
                >
                  Start Trading
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-border hover:border-primary text-foreground px-8 py-4 text-lg font-semibold"
                  data-testid="hero-learn-more"
                >
                  Learn More
                </Button>
              </div>
              <div className="mt-12 flex items-center justify-center lg:justify-start space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text" data-testid="stat-assets">$500M+</div>
                  <div className="text-sm text-muted-foreground">Assets Managed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text" data-testid="stat-traders">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Traders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold gradient-text" data-testid="stat-uptime">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="floating-animation">
                <Card className="premium-card backdrop-blur-sm" data-testid="hero-dashboard-preview">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold">Portfolio Overview</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-muted-foreground">Live</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Total Balance</div>
                        <div className="text-2xl font-bold gradient-text" data-testid="preview-total-balance">$125,430.50</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground">Today's P&L</div>
                        <div className="text-2xl font-bold text-green-400" data-testid="preview-daily-pnl">+$2,345.67</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Exness", icon: "EX", balance: "$45,230.20", pnl: "+2.34%", color: "bg-orange-500" },
                        { name: "Bybit", icon: "BY", balance: "$32,100.15", pnl: "+1.87%", color: "bg-yellow-500" },
                        { name: "Binance", icon: "BN", balance: "$48,100.15", pnl: "+3.12%", color: "bg-yellow-400" }
                      ].map((broker, index) => (
                        <div key={broker.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`preview-broker-${broker.name.toLowerCase().replace(/\s+/g, '-')}`}>
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 ${broker.color} rounded-full flex items-center justify-center`}>
                              <span className={`text-xs font-bold ${broker.name === "Binance" ? "text-black" : "text-white"}`}>{broker.icon}</span>
                            </div>
                            <div>
                              <div className="font-medium">{broker.name}</div>
                              <div className="text-sm text-muted-foreground">Connected</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{broker.balance}</div>
                            <div className="text-sm text-green-400">{broker.pnl}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-bold gradient-text mb-4" data-testid="features-title">Premium Trading Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="features-description">
              Experience the power of professional trading with our cutting-edge platform and exclusive features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Link,
                title: "Multi-Broker Integration",
                description: "Connect your Exness, Bybit, and Binance accounts seamlessly for unified portfolio management and automated trading.",
                color: "text-primary"
              },
              {
                icon: Bot,
                title: "AI Copy Trading",
                description: "Advanced copy trading system that mirrors our master traders' strategies across all your connected accounts.",
                color: "text-green-400"
              },
              {
                icon: TrendingUp,
                title: "Real-time Analytics",
                description: "Get instant portfolio updates, performance metrics, and detailed analytics across all your trading accounts.",
                color: "text-blue-400"
              },
              {
                icon: Users,
                title: "Referral Program",
                description: "Earn 10% commission on fees from investors you refer. Build your network and grow your passive income.",
                color: "text-purple-400"
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "Military-grade encryption, secure API connections, and advanced authentication to protect your investments.",
                color: "text-orange-400"
              },
              {
                icon: Headphones,
                title: "24/7 Support",
                description: "Premium support from our expert team, available around the clock to assist with your trading needs.",
                color: "text-red-400"
              }
            ].map((feature, index) => (
              <Card key={index} className="premium-card text-center" data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className={`${feature.color} h-8 w-8`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-serif font-bold gradient-text mb-6" data-testid="cta-title">
            Ready to Elevate Your Trading?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="cta-description">
            Join thousands of successful traders using our premium platform. Start earning today with our AI-powered copy trading system and lucrative referral program.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted} 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold transition-all transform hover:scale-105"
              data-testid="cta-start-trading"
            >
              Start Trading Now
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-border hover:border-primary text-foreground px-8 py-4 text-lg font-semibold"
              data-testid="cta-book-demo"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/10 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <ChartLine className="text-white h-4 w-4" />
                </div>
                <span className="text-xl font-serif font-bold gradient-text">AlvaCapital</span>
              </div>
              <p className="text-muted-foreground mb-4">Premium trading platform for professional investors and traders worldwide.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-linkedin">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-telegram">
                  <i className="fab fa-telegram text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-features">Features</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-pricing">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-security">Security</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-api">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-help">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-contact">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-community">Community</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-status">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-privacy">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-terms">Terms</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-license">License</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-compliance">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p data-testid="footer-copyright">&copy; 2025 AlvaCapital. All rights reserved. | Trading involves risk and may not be suitable for all investors.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
