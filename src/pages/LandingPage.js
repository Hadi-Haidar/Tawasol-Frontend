import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, ArrowRight, CheckCircle, Menu, X, Shield, Zap, Users } from 'lucide-react';

/**
 * LandingPage Component
 * Fully responsive landing page optimized for all devices
 * Includes mobile navigation, hero section, and feature cards
 */
const LandingPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center"
                onClick={closeMobileMenu}
              >
                <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors duration-200">
                  Tawasol
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Login Link */}
              <Link
                to="/login"
                className="px-3 lg:px-4 py-2 text-sm lg:text-base text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 touch-manipulation"
              >
                Login
              </Link>

              {/* Get Started Button */}
              <Link
                to="/signup"
                className="btn-primary text-sm lg:text-base px-4 lg:px-6 py-2 inline-flex items-center space-x-2 touch-manipulation"
              >
                <span className="whitespace-nowrap">Get Started</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 md:hidden">
              {/* Theme Toggle for Mobile */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Hamburger Menu */}
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 touch-manipulation"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
              <div className="flex flex-col space-y-3">
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors duration-200 touch-manipulation text-center"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={closeMobileMenu}
                  className="btn-primary px-4 py-3 inline-flex items-center justify-center space-x-2 touch-manipulation"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="text-center">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 leading-tight px-2">
              Welcome to{' '}
              <span className="text-primary-600 dark:text-primary-400 block sm:inline mt-2 sm:mt-0">
                Tawasol
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-2xl lg:max-w-3xl mx-auto px-4 leading-relaxed">
              Experience the future of productivity with our modern, intuitive platform. 
              Built for teams who demand excellence and simplicity.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center mb-12 sm:mb-16 md:mb-20 px-4 sm:px-0">
              <Link
                to="/signup"
                className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 inline-flex items-center justify-center space-x-2 touch-manipulation w-full sm:w-auto"
              >
                <span>Start Your Journey</span>
                <ArrowRight size={20} className="flex-shrink-0" />
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-3.5 touch-manipulation w-full sm:w-auto text-center"
              >
                Already have an account?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-12 sm:py-16 md:py-20 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Why Choose Tawasol?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
              Everything you need to collaborate, communicate, and succeed
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Feature 1 */}
            <FeatureCard
              icon={<Shield size={24} />}
              title="Secure Authentication"
              description="Multiple authentication methods including email and Google sign-in with enterprise-grade security."
            />

            {/* Feature 2 */}
            <FeatureCard
              icon={<Zap size={24} />}
              title="Modern Interface"
              description="Beautiful, responsive design with dark mode support for the best user experience across all devices."
            />

            {/* Feature 3 */}
            <FeatureCard
              icon={<Users size={24} />}
              title="Advanced Features"
              description="Comprehensive dashboard with rooms, posts, store, and profile management for seamless collaboration."
            />
          </div>
        </div>
      </section>

      {/* Footer/Bottom Section */}
      <section className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of teams already using Tawasol to transform their workflow
          </p>
          <Link
            to="/signup"
            className="btn-primary text-base sm:text-lg px-8 sm:px-10 py-3 sm:py-4 inline-flex items-center space-x-2 touch-manipulation"
          >
            <span>Create Your Free Account</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
};

/**
 * FeatureCard Component
 * Reusable card component for displaying features
 */
const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="group text-center p-6 sm:p-8 bg-gray-50 dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:-translate-y-1">
      {/* Icon */}
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-100 dark:bg-primary-900 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300">
        <div className="text-primary-600 dark:text-primary-400">
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default LandingPage;
