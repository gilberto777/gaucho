import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Search, FileText, User, LogOut, LayoutDashboard, ChevronDown, MessageCircle, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { generateWhatsAppLink } from '@/lib/whatsapp'; // Import the WhatsApp utility

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLogoLoaded, setIsLogoLoaded] = useState(true);
  const location = useLocation();
  const {
    user,
    broker,
    logout
  } = useAuth();
  const profileMenuRef = useRef(null);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };
  const handleWhatsAppClick = () => {
    window.open(generateWhatsAppLink(), '_blank');
  };
  const handlePhoneClick = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.open(generateWhatsAppLink(), '_blank');
    } else {
      window.location.href = 'tel:5511970259728';
    }
  };

  const dashboardHref = user ? '/admin/dashboard' : '/login';

  return <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'}`}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group" aria-label="Corretor Gaúcho Imóveis SP - Página inicial">
            {isLogoLoaded ? (
              <img
                src="/logo-gaucho.png"
                alt="Corretor Gaúcho Imóveis SP"
                className="h-[68px] w-[76px] object-contain"
                loading="eager"
                decoding="async"
                onError={() => setIsLogoLoaded(false)}
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                CG
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-xl font-semibold leading-none font-sans text-foreground">Corretor Gaúcho</span>
              <span className="text-[11px] font-medium tracking-wide text-muted-foreground">IMÓVEIS SP</span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            
            {/* Phone Number Display */}
            <button onClick={handlePhoneClick} className="hidden 2xl:flex items-center gap-2 text-foreground hover:text-foreground/80 font-medium transition-colors group flex-shrink-0" title="Fale Conosco">
              <div className="p-1.5 rounded-full transition-colors bg-secondary group-hover:bg-secondary/70">
                 <Phone className="w-4 h-4" />
              </div>
              <span className="whitespace-nowrap">(11) 97025-9728</span>
            </button>

            <Link to="/" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Início</Link>
            <Link to="/imoveis" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Imóveis</Link>
            <Link to="/blog" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Blog</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Contato</Link>
            
            <div className="border-t border-transparent my-1"></div>
            <div className="h-6 w-px bg-border"></div>

            <Link to={dashboardHref}>
              <Button className="bg-[#0d5a7a] text-white hover:bg-[#0d5a7a]/90 rounded-md px-5 shadow-sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Cadastrar imóvel
              </Button>
            </Link>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-5 shadow-sm" onClick={handleWhatsAppClick}>
              Entrar em contato
            </Button>

            {user ? <div className="flex items-center space-x-4">
                 <Link to="/admin/dashboard">
                    <Button variant="ghost" className="text-foreground hover:text-foreground/80 hover:bg-secondary font-medium">
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Painel
                    </Button>
                 </Link>
              
                <div className="relative" ref={profileMenuRef}>
                  <Button variant="ghost" className="flex items-center space-x-2 rounded-full px-4 hover:bg-secondary text-foreground" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-foreground text-sm font-bold">
                      {broker?.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium max-w-[100px] truncate">
                      {broker?.name || user.email}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  <AnimatePresence>
                    {isProfileOpen && <motion.div initial={{
                  opacity: 0,
                  y: 10
                }} animate={{
                  opacity: 1,
                  y: 0
                }} exit={{
                  opacity: 0,
                  y: 10
                }} transition={{
                  duration: 0.2
                }} className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-xl border border-border py-1 overflow-hidden z-50">
                        <Link to="/admin/dashboard" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-secondary" onClick={() => setIsProfileOpen(false)}>
                          <LayoutDashboard className="w-4 h-4 mr-2" /> Painel Admin
                        </Link>
                        <Link to="/perfil" className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-secondary" onClick={() => setIsProfileOpen(false)}>
                          <User className="w-4 h-4 mr-2" /> Meu Perfil
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" /> Sair
                        </button>
                      </motion.div>}
                  </AnimatePresence>
                </div>
              </div> : null}
          </div>

          {/* Mobile Toggle */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-foreground">
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && <motion.div initial={{
        opacity: 0,
        height: 0
      }} animate={{
        opacity: 1,
        height: 'auto'
      }} exit={{
        opacity: 0,
        height: 0
      }} className="md:hidden bg-white text-foreground border-t border-border overflow-hidden">
            <div className="px-4 py-6 space-y-4">
              <Link to="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary text-foreground font-medium">
                <Home className="w-5 h-5" /> <span>Início</span>
              </Link>
              <Link to="/imoveis" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary text-foreground font-medium">
                <Search className="w-5 h-5" /> <span>Imóveis</span>
              </Link>
              <Link to="/blog" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary text-foreground font-medium">
                <FileText className="w-5 h-5" /> <span>Blog</span>
              </Link>
              <Link to="/contact" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-secondary text-foreground font-medium">
                <MessageCircle className="w-5 h-5" /> <span>Contato</span>
              </Link>
              
              <div className="border-t border-border my-4"></div>

              {/* WhatsApp Button for Mobile */}
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleWhatsAppClick}>
                  Entrar em contato
              </Button>

              {user ? <>
                  <Link to="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-lg bg-secondary text-foreground font-medium">
                    <LayoutDashboard className="w-5 h-5" /> <span>Painel</span>
                  </Link>
                  <Link to="/perfil" className="flex items-center space-x-3 p-3 rounded-lg bg-secondary text-foreground font-medium">
                    <User className="w-5 h-5" /> <span>Meu Perfil</span>
                  </Link>
                  <button onClick={logout} className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 text-red-600 font-medium">
                    <LogOut className="w-5 h-5" /> <span>Sair</span>
                  </button>
                </> : null}
            </div>
          </motion.div>}
      </AnimatePresence>
    </nav>;
};
export default Navigation;
