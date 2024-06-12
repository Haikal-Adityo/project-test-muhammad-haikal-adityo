
// Enable hidden navbar
const nav = document.querySelector('.navbar');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    if (lastScrollY < window.scrollY) {
        nav.classList.add('nav-hidden');
    } else {
        nav.classList.remove('nav-hidden');
    }

    lastScrollY = window.scrollY;
});

// POST & CONTROLS
document.addEventListener("DOMContentLoaded", function() {
    const postList = document.querySelector(".post-list");
    const postListContainer = postList.querySelector(".post-list-container");
    const pagination = postList.querySelector(".pagination");
    const prevButton = pagination.querySelector(".prev");
    const nextButton = pagination.querySelector(".next");
    const firstButton = pagination.querySelector(".first");
    const lastButton = pagination.querySelector(".last");
    const pageNumberElement = pagination.querySelector(".page-numbers");
    const showingElement = postList.querySelector(".showing");
    const sortOptionsElement = postList.querySelector(".sort-options");
    const itemsPerPageElement = postList.querySelector(".items-per-page-options");

    let itemsPerPage = parseInt(itemsPerPageElement.value);
    let currentPage = 1;
    let totalItems = 0;
    let posts = [];

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    }

    function fetchPosts(page, sortOption) {
        let sortParam = '';
        if (sortOption === "newest") {
            sortParam = '&sort=-published_at';
        } else if (sortOption === "oldest") {
            sortParam = '&sort=published_at';
        }
        
        const apiUrl = `https://suitmedia-backend.suitdev.com/api/ideas?page[number]=${page}&page[size]=${itemsPerPage}${sortParam}`;
        
        fetch(apiUrl, {
            headers: {
                'Accept': 'application/json',
            },
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('API response data:', data);
            totalItems = data.meta.total;
            posts = data.data.map(item => ({
                thumbnail: extractThumbnailFromContent(item.content),
                title: item.title,
                published_at: item.published_at
            }));
            console.log('Fetched posts:', posts);
            renderPosts(posts);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }
    
    
    function extractThumbnailFromContent(content) {
        // Parse the HTML content
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        
        // Find the first image tag
        const imgElement = doc.querySelector('img');
        
        try {
            // Check if the image element exists and if the src attribute is not empty
            if (imgElement && imgElement.getAttribute('src')) {
                // Return the src attribute of the image tag
                return imgElement.getAttribute('src');
            }
        } catch (error) {
            // Log the error if any occurs
            console.error('Error retrieving image source:', error);
        }
        
        // Use a default thumbnail URL when the image cannot be accessed
        return 'assets/default-thumbnail.webp';
    }    

    function renderPosts(posts) {
        postListContainer.innerHTML = "";
        posts.forEach(post => {
            const postElement = document.createElement("div");
            postElement.classList.add("post");
            postElement.innerHTML = `
                <img class="post-thumbnail lazy" data-src="${post.thumbnail}" alt="Post Thumbnail" onerror="this.src='assets/default-thumbnail.webp';">
                <div class="post-details">
                    <p class="post-date">${formatDate(post.published_at)}</p>
                    <h2 class="post-title">${post.title}</h2>
                </div>
            `;
            postListContainer.appendChild(postElement);
        });

        renderPagination();
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(start + itemsPerPage - 1, totalItems);
        showingElement.textContent = `Showing ${start} - ${end} of ${totalItems}`;

        // Initialize lazy loading
        lazyLoadImages();
    }

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        pageNumberElement.innerHTML = "";
    
        const createButton = (page, content) => {
            const button = document.createElement("button");
            button.innerHTML = content;
            button.disabled = page === currentPage;
            button.addEventListener("click", () => goToPage(page));
            return button;
        };
    
        if (currentPage > 1) {
            firstButton.classList.remove("inactive");
            prevButton.classList.remove("inactive");
        } else {
            firstButton.classList.add("inactive");
            prevButton.classList.add("inactive");
        }
    
        let startPage, endPage;
        if (totalPages <= 5) {
            startPage = 1;
            endPage = totalPages;
        } else {
            if (currentPage <= 3) {
                startPage = 1;
                endPage = 5;
            } else if (currentPage + 2 >= totalPages) {
                startPage = totalPages - 4;
                endPage = totalPages;
            } else {
                startPage = currentPage - 2;
                endPage = currentPage + 2;
            }
        }
    
        for (let i = startPage; i <= endPage; i++) {
            const button = createButton(i, i);
            if (i === currentPage) {
                button.classList.add("active");
            }
            pageNumberElement.appendChild(button);
        }
    
        if (currentPage < totalPages) {
            nextButton.classList.remove("inactive");
            lastButton.classList.remove("inactive");
        } else {
            nextButton.classList.add("inactive");
            lastButton.classList.add("inactive");
        }
    }
    function goToPage(page) {
        currentPage = page;
        fetchPosts(currentPage, sortOptionsElement.value);
    }

    function nextPage() {
        if (currentPage < Math.ceil(totalItems / itemsPerPage)) {
            goToPage(currentPage + 1);
        }
    }

    function prevPage() {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    }

    function FirstPage() {
        if (currentPage > 1) {
            goToPage(1);
        }
    }
    
    function LastPage() {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (currentPage < totalPages) {
            goToPage(totalPages);
        }
    }
    
    function lazyLoadImages() {
        const lazyImages = document.querySelectorAll('.lazy');
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
    
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    lazyImage.src = lazyImage.dataset.src;
                    lazyImage.classList.remove('lazy');
                    imageObserver.unobserve(lazyImage);
                }
            });
        }, options);
    
        lazyImages.forEach(image => {
            image.src = '';
            imageObserver.observe(image);
        });
    }
    

    firstButton.addEventListener("click", FirstPage);
    lastButton.addEventListener("click", LastPage);

    prevButton.addEventListener("click", prevPage);
    nextButton.addEventListener("click", nextPage);

    // Function to sort posts based on the selected option
    function sortPosts(option) {
        if (option === "newest") {
            posts.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
        } else if (option === "oldest") {
            posts.sort((a, b) => new Date(a.published_at) - new Date(b.published_at));
        }
    }

    // Event listener for sort options change
    sortOptionsElement.addEventListener("change", function() {
        const sortOption = this.value;
        sortPosts(sortOption);
        fetchPosts(currentPage, sortOptionsElement.value);
    });

    // Initial render
    fetchPosts(currentPage, sortOptionsElement.value);
});

// PARALLAX ZOOM
window.addEventListener('scroll', () => {
    const bannerImage = document.querySelector('.banner-image');
    const scrollPosition = window.scrollY;

    const scaleFactor = 1 + scrollPosition / 1500; 

    bannerImage.style.transform = `scale(${scaleFactor})`;
});
