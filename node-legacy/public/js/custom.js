$(document).ready(function() {
    // Note: The main comment submission is handled via standard form POST in the provided routes.
    // However, here is an example of how you might enhance it with AJAX if the route supported it.
    // Since our current route redirects, we'll keep the standard form submission for now to ensure consistency.

    // Example: Confirm Delete
    $('.btn-danger').on('click', function(e) {
        if (!confirm('Are you sure you want to delete this item?')) {
            e.preventDefault();
        }
    });

    console.log('Custom JS loaded.');
});