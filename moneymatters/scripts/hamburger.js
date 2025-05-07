document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.querySelector(".hamburger");
    const nav = document.querySelector(".top");

    // Check if the screen size is mobile (for example, max-width of 768px)
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
        // Force nav to be hidden on load
        nav.classList.remove("show");
        nav.style.display = "none";

        menuToggle.addEventListener("click", function () {
            const isVisible = nav.classList.toggle("show");

            // Toggle display manually
            if (isVisible) {
                nav.style.display = "flex";
            } else {
                nav.style.display = "none";
            }
        });
    }
});






