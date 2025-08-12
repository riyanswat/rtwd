document.addEventListener('DOMContentLoaded', function() {
    // Function to set the active state in the navigation
    const setActiveNav = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.main-nav a');

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            link.classList.remove('active');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    };

    // Generic data fetching function
    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch data from ${url}:`, error);
            return null;
        }
    }

    // --- HOMEPAGE SPECIFIC CODE ---
    if (document.querySelector('.hero-section')) {
        // Load shipments preview
        (async function loadShipmentsPreview() {
            const data = await fetchData('data/shipments.json');
            if (!data || !data.shipments) return;
            const container = document.getElementById('shipments-preview-grid');
            if (!container) return;
            const shipmentsToShow = data.shipments.slice(0, 3);
            let html = '';
            shipmentsToShow.forEach(shipment => {
                html += `
                    <div class="shipment-card">
                        <img src="images/placeholder.svg" alt="${shipment.make} ${shipment.model}" class="shipment-card-img">
                        <div class="shipment-card-content">
                            <h3 class="shipment-card-title">${shipment.year} ${shipment.make} ${shipment.model}</h3>
                            <p class="shipment-card-destination">Shipped to: <strong>${shipment.destination}</strong></p>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        })();

        // Load testimonials preview
        (async function loadTestimonialsPreview() {
            const data = await fetchData('data/testimonials.json');
            if (!data || !data.testimonials) return;
            const container = document.getElementById('testimonials-preview-container');
            if (!container) return;
            const testimonialsToShow = data.testimonials.slice(0, 2);
            let html = '';
            testimonialsToShow.forEach(testimonial => {
                html += `
                    <div class="testimonial-card">
                        <blockquote>"${testimonial.quote}"</blockquote>
                        <cite>– ${testimonial.author}, ${testimonial.location}</cite>
                    </div>
                `;
            });
            container.innerHTML = html;
        })();
    }

    // --- CONTACT PAGE SPECIFIC CODE ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const form = e.target;
            const data = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            try {
                const response = await fetch(form.action, {
                    method: form.method,
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    showPopup("✅ Your message has been sent successfully!");
                    form.reset();
                } else {
                    const responseData = await response.json();
                    if (Object.hasOwn(responseData, 'errors')) {
                        const errorMsg = responseData["errors"].map(error => error["message"]).join(", ");
                        showPopup(`❌ Error: ${errorMsg}`);
                    } else {
                        showPopup("❌ An unknown error occurred. Please try again.");
                    }
                }
            } catch (error) {
                showPopup("❌ Oops! Something went wrong. Please check your connection and try again.");
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Inquiry';
            }
        });
    }

    // --- SHIPMENTS PAGE SPECIFIC CODE ---
    const shipmentsGrid = document.getElementById('shipments-full-grid');
    if (shipmentsGrid) {
        let allShipments = [];
        let currentShipmentImages = [];
        let currentImageIndex = 0;
        const modal = document.getElementById('image-modal');
        let mainImage, thumbnailsContainer;
        if (modal) {
            mainImage = document.getElementById('modal-main-image');
            thumbnailsContainer = modal.querySelector('.modal-thumbnails');
        }

        const renderShipments = (shipments) => {
            if (shipments.length === 0) {
                shipmentsGrid.innerHTML = '<p class="loading-message">No shipments found matching your criteria.</p>';
                return;
            }
            shipmentsGrid.innerHTML = shipments.map(shipment => `
                <div class="shipment-card" data-shipment-id="${shipment.id}">
                    <img src="images/placeholder.svg" alt="${shipment.make} ${shipment.model}" class="shipment-card-img">
                    <div class="shipment-card-content">
                        <h3 class="shipment-card-title">${shipment.year} ${shipment.make} ${shipment.model}</h3>
                        <p class="shipment-card-destination">Shipped to: <strong>${shipment.destination}</strong></p>
                    </div>
                </div>
            `).join('');
        };

        const filterAndRender = () => {
            const country = document.getElementById('country-filter').value;
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const filteredShipments = allShipments.filter(shipment => {
                const matchesCountry = (country === 'all' || shipment.destination === country);
                const matchesSearch = (
                    shipment.make.toLowerCase().includes(searchTerm) ||
                    shipment.model.toLowerCase().includes(searchTerm) ||
                    shipment.year.toString().includes(searchTerm)
                );
                return matchesCountry && matchesSearch;
            });
            renderShipments(filteredShipments);
        };

        function showImage(index) {
            mainImage.src = 'images/placeholder.svg'; // Replace with actual path construction later
            mainImage.alt = currentShipmentImages[index];
            currentImageIndex = index;

            thumbnailsContainer.querySelector('.active')?.classList.remove('active');
            thumbnailsContainer.children[index]?.classList.add('active');
        }

        function openModal(shipment) {
            currentShipmentImages = [shipment.coverImage, ...shipment.gallery];
            thumbnailsContainer.innerHTML = '';

            currentShipmentImages.forEach((imgName, index) => {
                const thumb = document.createElement('img');
                thumb.src = 'images/placeholder.svg'; // Replace with actual path
                thumb.dataset.index = index;
                if (index === 0) thumb.classList.add('active');
                thumb.addEventListener('click', () => showImage(index));
                thumbnailsContainer.appendChild(thumb);
            });

            showImage(0);
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10);
            document.body.classList.add('modal-open');
        }

        function closeModal() {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        }

        (async function initShipmentsPage() {
            const data = await fetchData('data/shipments.json');
            if (!data || !data.shipments) {
                shipmentsGrid.innerHTML = '<p class="loading-message">Could not load shipment data.</p>';
                return;
            }
            allShipments = data.shipments;

            const countryFilter = document.getElementById('country-filter');
            const countries = [...new Set(allShipments.map(s => s.destination))];
            countries.sort().forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                countryFilter.appendChild(option);
            });

            renderShipments(allShipments);

            countryFilter.addEventListener('change', filterAndRender);
            document.getElementById('search-input').addEventListener('input', filterAndRender);

            if (modal) {
                shipmentsGrid.addEventListener('click', e => {
                    const card = e.target.closest('.shipment-card');
                    if (card) {
                        const shipmentId = parseInt(card.dataset.shipmentId, 10);
                        const shipment = allShipments.find(s => s.id === shipmentId);
                        if (shipment) openModal(shipment);
                    }
                });

                modal.addEventListener('click', e => {
                    if (e.target === modal || e.target.classList.contains('close-modal')) {
                        closeModal();
                    }
                });

                modal.querySelector('.modal-next').addEventListener('click', () => {
                    const nextIndex = (currentImageIndex + 1) % currentShipmentImages.length;
                    showImage(nextIndex);
                });

                modal.querySelector('.modal-prev').addEventListener('click', () => {
                    const prevIndex = (currentImageIndex - 1 + currentShipmentImages.length) % currentShipmentImages.length;
                    showImage(prevIndex);
                });

                // Keyboard navigation for modal
                document.addEventListener('keydown', function (e) {
                    if (!modal.classList.contains('show')) return;

                    if (e.key === 'ArrowRight') {
                        modal.querySelector('.modal-next')?.click();
                    } else if (e.key === 'ArrowLeft') {
                        modal.querySelector('.modal-prev')?.click();
                    } else if (e.key === 'Escape') {
                        closeModal();
                    }
                });
            }
        })();
    }

    function showPopup(message) {
        const existingPopup = document.querySelector('.popup');
        if (existingPopup) {
            existingPopup.remove();
        }

        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add('show');
        }, 10);

        setTimeout(() => {
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove(), { once: true });
        }, 4000);
    }

    // --- GLOBAL ANIMATIONS & MOBILE NAV ---
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileNavToggle.classList.toggle('active');
        });
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    const elementsToAnimate = document.querySelectorAll('.section-padding, .shipment-card, .testimonial-card, .value-card, .step-card, .page-header');
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in-up');
        observer.observe(el);
    });

    // --- GLOBAL SITE-WIDE CODE ---
    const logoLink = document.getElementById('site-logo-link');
    if (logoLink) {
        logoLink.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }

    // Call functions on page load
    setActiveNav();
});
