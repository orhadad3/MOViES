document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('databaseModeToggle');
    const modal = new bootstrap.Modal(document.getElementById('databaseToggleModal'));
    const confirmBtn = document.getElementById('confirmToggle');
    
    toggle.addEventListener('change', function(e) {
        e.preventDefault();
        this.checked = !this.checked; // Revert until confirmed
        modal.show();
    });
    
    confirmBtn.addEventListener('click', async function() {
        try {
            const response = await fetch('/admin/toggle-database', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('success', result.message);
                modal.hide();

                if(result.autoRestart) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error toggling database mode:', error);
            showAlert('danger', `Error: ${error.message}`);
        }
    });
    
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 400px;';
        alertDiv.innerHTML = `
            <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => alertDiv.remove(), 5000);
    }   
});