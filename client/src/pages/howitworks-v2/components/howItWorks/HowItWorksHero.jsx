import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Button from '../common/Button';

const HowItWorksHero = () => {
    const scrollToProcess = () => {
        const processSection = document.getElementById('process-overview');

        if (processSection) {
            processSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    return (
        <section className="hero" id="how-it-works">
            <div className="container">
                <div className="hero-grid">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="hero-badge">
                            <Star
                                size={16}
                                fill="currentColor"
                                aria-hidden="true"
                            />
                            <span>Booked, paid, done.</span>
                        </div>

                        <h1 className="hero-title">
                            From shared link to{' '}
                            <span className="highlight">
                                money in your account
                            </span>{' '}
                            — in just a few clicks.
                        </h1>

                        <p className="hero-desc">
                            Book A Sloth gives you one link where clients pick a
                            service, book a time, and pay you over UPI — with
                            automatic confirmations and reminders. You just share
                            the link.
                        </p>

                        <div className="hero-actions">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={scrollToProcess}
                            >
                                Know How It Works
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default HowItWorksHero;