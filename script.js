document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* ==========================================================================
       1. NAV RESIZING ON SCROLL
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* ==========================================================================
       2. MOBILE DRAWER NAVIGATION
       ========================================================================== */
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function toggleMobileMenu() {
        const isOpen = navMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        
        // Swap menu icon between burger and close
        const icon = mobileToggle.querySelector('i');
        if (isOpen) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    }

    mobileToggle.addEventListener('click', toggleMobileMenu);
    mobileOverlay.addEventListener('click', toggleMobileMenu);

    // Close menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    /* ==========================================================================
       3. NAVIGATION LINK SCROLL SPY
       ========================================================================== */
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 150; // offset for navbar height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < (sectionTop + sectionHeight)) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    /* ==========================================================================
       4. STATS COUNTER ANIMATION
       ========================================================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    let hasAnimatedStats = false;

    function animateStats() {
        statNumbers.forEach(stat => {
            const text = stat.innerText;
            if (text.includes('+') || text.includes('%') || text.includes('-')) {
                const target = parseFloat(stat.getAttribute('data-target'));
                if (isNaN(target)) return;

                let current = 0;
                const duration = 1500; // ms
                const stepTime = 15; // ms
                const steps = duration / stepTime;
                const increment = target / steps;

                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        stat.innerText = target + (text.includes('+') ? '+' : (text.includes('%') ? '%' : ''));
                        clearInterval(timer);
                    } else {
                        stat.innerText = Math.floor(current) + (text.includes('+') ? '+' : (text.includes('%') ? '%' : ''));
                    }
                }, stepTime);
            }
        });
    }

    // Trigger stats animation when visible in viewport
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasAnimatedStats) {
                    animateStats();
                    hasAnimatedStats = true;
                }
            });
        }, { threshold: 0.2 });

        observer.observe(statsSection);
    }

    /* ==========================================================================
       5. DATE PICKER SETUP (RESTRICT PAST DATES)
       ========================================================================== */
    const dateInput = document.getElementById('booking_date');
    if (dateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        // Set min date to today
        const minDateString = `${yyyy}-${mm}-${dd}`;
        dateInput.setAttribute('min', minDateString);
    }

    /* ==========================================================================
       6. FORM SUBMISSION & LOCALSTORAGE & MODAL
       ========================================================================== */
    const form = document.getElementById('appointment-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnSpinner = document.getElementById('btn-spinner');
    const successModal = document.getElementById('success-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Modal fields
    const modalUserName = document.getElementById('modal-user-name');
    const modalCarModel = document.getElementById('modal-car-model');
    const modalService = document.getElementById('modal-service');
    const modalDate = document.getElementById('modal-date');
    const modalSlot = document.getElementById('modal-slot');
    const modalPhone = document.getElementById('modal-phone');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Perform Custom Phone Validation (Indian format)
            const phoneInput = document.getElementById('phone');
            const phoneVal = phoneInput.value.replace(/\s+/g, ''); // strip spaces
            const indianPhoneRegex = /^[6-9]\d{9}$/;

            if (!indianPhoneRegex.test(phoneVal)) {
                phoneInput.setCustomValidity("Please enter a valid 10-digit Indian phone number starting with 6-9.");
                phoneInput.reportValidity();
                return;
            } else {
                phoneInput.setCustomValidity("");
            }

            // Gather values
            const formData = new FormData(form);
            const bookingDetails = {
                fullName: formData.get('full_name'),
                phone: '+91 ' + formData.get('phone'),
                carModel: formData.get('car_model'),
                serviceType: formData.get('service_type'),
                bookingDate: formData.get('booking_date'),
                timeSlot: formData.get('time_slot'),
                notes: formData.get('notes'),
                timestamp: new Date().toISOString()
            };

            // UI feedback: disable button, show spinner
            submitBtn.disabled = true;
            const btnText = submitBtn.querySelector('span');
            const btnArrow = submitBtn.querySelector('.btn-arrow');
            const originalText = btnText.innerText;
            btnText.innerText = "Processing...";
            if (btnArrow) btnArrow.style.display = 'none';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';

            // Save backup locally in localStorage
            localStorage.setItem('reincarnation_latest_booking', JSON.stringify(bookingDetails));

            // Submit using fetch to submit_booking.php
            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(errData.message || 'Server error occurred.');
                    }).catch(() => {
                        throw new Error('Server connection failed (Status ' + response.status + ').');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success) {
                    // Populate Modal details
                    modalUserName.innerText = bookingDetails.fullName;
                    modalCarModel.innerText = bookingDetails.carModel;
                    modalService.innerText = bookingDetails.serviceType;
                    
                    // Format Date nicely: e.g. 2026-06-01 to 01-Jun-2026
                    const dateParts = bookingDetails.bookingDate.split('-');
                    if (dateParts.length === 3) {
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const day = dateParts[2];
                        const month = months[parseInt(dateParts[1]) - 1];
                        const year = dateParts[0];
                        modalDate.innerText = `${day}-${month}-${year}`;
                    } else {
                        modalDate.innerText = bookingDetails.bookingDate;
                    }
                    
                    modalSlot.innerText = bookingDetails.timeSlot;
                    modalPhone.innerText = bookingDetails.phone;

                    // Show Success Modal
                    successModal.classList.add('active');
                    
                    // Reset Form
                    form.reset();
                } else {
                    throw new Error((data && data.message) || 'Booking submission failed.');
                }
            })
            .catch(error => {
                console.error("Booking Error:", error);
                
                // Strictly show error alert instead of success screen when booking fails
                alert(`Booking Failed: ${error.message}\n\nPlease try again or contact us directly on WhatsApp (+91 98950 12345) to book your slot!`);
            })
            .finally(() => {
                // Restore button states
                submitBtn.disabled = false;
                btnText.innerText = originalText;
                if (btnArrow) btnArrow.style.display = 'inline-block';
                if (btnSpinner) btnSpinner.style.display = 'none';
            });
        });
    }

    // Modal Close
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }
    
    // Close modal if user clicks background wrapper
    if (successModal) {
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
            }
        });
    }
});
