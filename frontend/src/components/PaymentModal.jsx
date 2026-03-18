import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(2, 6, 23, 0.9)',
        backdropFilter: 'blur(16px)',
        zIndex: 20000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    modal: {
        background: '#0f172a',
        width: '100%',
        maxWidth: '450px',
        borderRadius: '28px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '30px',
        color: 'white',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        animation: 'modalFadeIn 0.3s ease-out'
    },
    header: {
        textAlign: 'center',
        marginBottom: '25px'
    },
    badge: {
        background: 'rgba(56, 189, 248, 0.1)',
        color: '#38bdf8',
        padding: '4px 12px',
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.1em'
    },
    qrPlaceholder: {
        width: '180px',
        height: '180px',
        background: 'white',
        margin: '20px auto',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px'
    },
    priceTag: {
        fontSize: '2rem',
        fontWeight: 900,
        textAlign: 'center',
        margin: '10px 0'
    },
    upiInput: {
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '14px',
        color: 'white',
        fontSize: '1rem',
        marginTop: '15px',
        outline: 'none',
        textAlign: 'center'
    },
    btn: {
        width: '100%',
        padding: '16px',
        borderRadius: '14px',
        background: '#38bdf8',
        color: '#0f172a',
        border: 'none',
        fontWeight: 800,
        fontSize: '1rem',
        marginTop: '25px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default function PaymentModal({ isOpen, onClose, onShowSuccess }) {
    const [upi, setUpi] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, success

    if (!isOpen) return null;

    const handlePay = async () => {
        setStatus('processing');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found (Try logging in again)");

            // 1. Create order on backend
            const resOrder = await fetch('http://127.0.0.1:8000/create-razorpay-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, amount: 29900 }) 
            });
            const orderData = await resOrder.json();

            if (orderData.status !== 'success') {
                throw new Error(orderData.detail || 'Failed to create order');
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: "Profilr Pro",
                description: "Full Platform Upgrade",
                order_id: orderData.order.id,
                handler: async function (response) {
                    const resVerify = await fetch('http://127.0.0.1:8000/verify-razorpay-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    const verifyData = await resVerify.json();
                    if (verifyData.status === 'success') {
                        setStatus('success');
                        setTimeout(() => {
                            onShowSuccess();
                            onClose();
                        }, 1500);
                    } else {
                        throw new Error('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.user_metadata?.full_name || "",
                    email: user.email,
                },
                theme: {
                    color: "#38bdf8"
                },
                modal: {
                    ondismiss: function() {
                        setStatus('idle');
                    }
                }
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.open();
        } catch (err) {
            console.error("Upgrade error:", err);
            alert(`Upgrade failed: ${err.message}`);
            setStatus('idle');
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <style>{`
                    @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    .pay-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(56, 189, 248, 0.3); }
                    .pay-btn:active { transform: scale(0.98); }
                `}</style>

                <div style={styles.header}>
                    <span style={styles.badge}>SECURE CHECKOUT [TEST MODE]</span>
                    <h2 style={{ margin: '15px 0 5px 0', fontSize: '1.5rem', fontWeight: 900 }}>Upgrade to Pro</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Unlock global themes & deep ATS analytics</p>
                </div>

                <div style={styles.priceTag}>₹299.00</div>

                <div style={{ margin: '30px 0', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fa-solid fa-check" style={{color: '#10b981'}}></i> Premium Portfolios</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fa-solid fa-check" style={{color: '#10b981'}}></i> Custom URLs</li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fa-solid fa-check" style={{color: '#10b981'}}></i> Deep ATS Analytics</li>
                    </ul>
                </div>

                <div style={{ padding: '15px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.05)', color: '#38bdf8', fontSize: '0.75rem', lineHeight: 1.5, marginBottom: '20px', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
                    <i className="fa-solid fa-info-circle" style={{marginRight: '8px'}}></i>
                    <strong>Razorpay Test Mode:</strong> Click below to open the secure overlay. Choose "Netbanking" & click "Success" to simulate payment.
                </div>

                <button 
                    style={{ ...styles.btn, opacity: status === 'processing' ? 0.7 : 1, cursor: status === 'processing' ? 'not-allowed' : 'pointer' }} 
                    className="pay-btn"
                    onClick={handlePay}
                    disabled={status === 'processing'}
                >
                    {status === 'processing' ? (
                        <><i className="fa-solid fa-circle-notch fa-spin"></i> Initializing Secure Link...</>
                    ) : status === 'success' ? (
                        <><i className="fa-solid fa-check"></i> Upgrade Complete!</>
                    ) : (
                        `Checkout with Razorpay`
                    )}
                </button>

                <button 
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', width: '100%', marginTop: '15px', cursor: 'pointer' }}
                >
                    Cancel Transaction
                </button>
            </div>
        </div>
    );
}
