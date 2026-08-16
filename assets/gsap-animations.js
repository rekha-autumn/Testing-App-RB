/**
 * gsap-animations.js
 * Central GSAP animation controller for the Autumn theme.
 * Requires: gsap.min.js + ScrollTrigger.min.js loaded before this file.
 */

document.addEventListener('DOMContentLoaded', function () {
  // ─────────────────────────────────────────────────────────────
  // Guard: bail if GSAP didn't load (e.g. script blocked)
  // ─────────────────────────────────────────────────────────────
  if (typeof gsap === 'undefined') return;

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // ─────────────────────────────────────────────────────────────
  // 1. HEADER — slide down on initial page load
  // ─────────────────────────────────────────────────────────────
  gsap.from('#header-group', {
    y: -70,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
  });

  // ─────────────────────────────────────────────────────────────
  // 2. HERO — fade + lift the hero container on load
  // ─────────────────────────────────────────────────────────────
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    // Hero background media scales in subtly
    gsap.from('.hero__media', {
      scale: 1.06,
      opacity: 0,
      duration: 1.4,
      ease: 'power2.out',
    });

    // Content blocks stagger in from below
    const heroBlocks = heroEl.querySelectorAll('.text-block, .button');
    if (heroBlocks.length) {
      gsap.from(heroBlocks, {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        delay: 0.3,
        ease: 'power3.out',
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. SECTION HEADINGS — slide up when scrolled into view
  // ─────────────────────────────────────────────────────────────
  gsap.utils.toArray('.section').forEach((section) => {
    // Target common heading/subheading elements within each section
    const headings = section.querySelectorAll('h1, h2, h3, h4, .h1, .h2, .h3, .h4');
    if (!headings.length) return;

    gsap.from(headings, {
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        toggleActions: 'play none none none',
      },
      y: 35,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. PRODUCT CARDS — staggered fade-up on scroll
  // ─────────────────────────────────────────────────────────────
  gsap.utils.toArray('.product-card').forEach((card, index) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      y: 45,
      opacity: 0,
      duration: 0.65,
      delay: (index % 4) * 0.08, // stagger within rows
      ease: 'power2.out',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. RESOURCE CARDS (blog, collection cards) — fade up
  // ─────────────────────────────────────────────────────────────
  gsap.utils.toArray('.resource-card').forEach((card, index) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      y: 40,
      opacity: 0,
      duration: 0.7,
      delay: (index % 3) * 0.1,
      ease: 'power2.out',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. COLLECTION LINKS — scale + fade in
  // ─────────────────────────────────────────────────────────────
  gsap.utils.toArray('.collection-card').forEach((card, index) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        toggleActions: 'play none none none',
      },
      scale: 0.94,
      opacity: 0,
      duration: 0.7,
      delay: (index % 4) * 0.1,
      ease: 'power2.out',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. MEDIA WITH CONTENT — left/right alternating slide-in
  // ─────────────────────────────────────────────────────────────
  gsap.utils.toArray('.section--full-width .hero__media-grid').forEach((grid) => {
    gsap.from(grid, {
      scrollTrigger: {
        trigger: grid,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      x: -50,
      opacity: 0,
      duration: 0.9,
      ease: 'power2.out',
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. FOOTER — gentle fade up
  // ─────────────────────────────────────────────────────────────
  gsap.from('footer', {
    scrollTrigger: {
      trigger: 'footer',
      start: 'top 95%',
      toggleActions: 'play none none none',
    },
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
  });

  // ─────────────────────────────────────────────────────────────
  // 9. MARQUEE — pause GSAP during native CSS marquee sections
  //    (no interference, just a safety refresh on resize)
  // ─────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
});
