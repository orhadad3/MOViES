document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitBtn');
    
    // Validation state
    let validationState = {
        username: false,
        email: false,
        password: false,
        confirmPassword: false
    };

    // Bootstrap tooltip instances
    let usernameTooltip, passwordTooltip, confirmPasswordTooltip;

    /**
     * Generate username validation content
     */
    function getUsernameValidationContent() {
        const value = usernameInput.value;
        const isValidLength = value.length < 50 && value.length > 0;
        
        return `
            <div class="tooltip-header">Username Requirements</div>
            <div class="requirement ${value.length > 0 ? (isValidLength ? 'valid' : 'invalid') : 'neutral'}">
                <i class="bi bi-${value.length > 0 ? (isValidLength ? 'check-circle-fill' : 'x-circle-fill') : 'circle'}"></i>
                <span>Less than 50 characters</span>
            </div>
        `;
    }

    /**
     * Generate password validation content
     */
    function getPasswordValidationContent() {
        const value = passwordInput.value;
        const hasValidLength = value.length >= 6 && value.length <= 15;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[\W_]/.test(value);
        
        const getRequirementClass = (condition) => {
            if (value.length === 0) return 'neutral';
            return condition ? 'valid' : 'invalid';
        };
        
        const getRequirementIcon = (condition) => {
            if (value.length === 0) return 'circle';
            return condition ? 'check-circle-fill' : 'x-circle-fill';
        };
        
        return `
            <div class="tooltip-header">Password Requirements</div>
            <div class="requirement ${getRequirementClass(hasValidLength)}">
                <i class="bi bi-${getRequirementIcon(hasValidLength)}"></i>
                <span>6-15 characters long</span>
            </div>
            <div class="requirement ${getRequirementClass(hasUppercase)}">
                <i class="bi bi-${getRequirementIcon(hasUppercase)}"></i>
                <span>At least one uppercase letter</span>
            </div>
            <div class="requirement ${getRequirementClass(hasLowercase)}">
                <i class="bi bi-${getRequirementIcon(hasLowercase)}"></i>
                <span>At least one lowercase letter</span>
            </div>
            <div class="requirement ${getRequirementClass(hasNumber)}">
                <i class="bi bi-${getRequirementIcon(hasNumber)}"></i>
                <span>At least one number</span>
            </div>
            <div class="requirement ${getRequirementClass(hasSpecial)}">
                <i class="bi bi-${getRequirementIcon(hasSpecial)}"></i>
                <span>At least one special character</span>
            </div>
        `;
    }

    /**
     * Generate confirm password validation content
     */
    function getConfirmPasswordValidationContent() {
        const value = confirmPasswordInput.value;
        const passwordValue = passwordInput.value;
        const passwordsMatch = value === passwordValue && passwordValue.length > 0 && validationState.password;
        
        const getRequirementClass = () => {
            if (value.length === 0) return 'neutral';
            return passwordsMatch ? 'valid' : 'invalid';
        };
        
        const getRequirementIcon = () => {
            if (value.length === 0) return 'circle';
            return passwordsMatch ? 'check-circle-fill' : 'x-circle-fill';
        };
        
        return `
            <div class="tooltip-header">Password Confirmation</div>
            <div class="requirement ${getRequirementClass()}">
                <i class="bi bi-${getRequirementIcon()}"></i>
                <span>Passwords match</span>
            </div>
        `;
    }

    /**
     * Update tooltip content
     */
    function updateTooltipContent(tooltip, contentFunction) {
        if (tooltip && tooltip._element) {
            const tooltipInner = document.querySelector('.tooltip-inner');
            if (tooltipInner) {
                tooltipInner.innerHTML = contentFunction();
            }
        }
    }

    /**
     * Check if all validations pass and update submit button
     */
    function updateSubmitButton() {
        const allValid = Object.values(validationState).every(state => state === true);
        submitBtn.disabled = !allValid;
        
        if (allValid) {
            submitBtn.classList.remove('btn-secondary');
            submitBtn.classList.add('btn-primary');
        } else {
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-secondary');
        }
    }

    /**
     * Validate username
     */
    function validateUsername(value) {
        const isValidLength = value.length < 50 && value.length > 0;
        
        // Update input styling
        if (value.length > 0) {
            if (isValidLength) {
                usernameInput.classList.remove('is-invalid');
                usernameInput.classList.add('is-valid');
                validationState.username = true;
            } else {
                usernameInput.classList.remove('is-valid');
                usernameInput.classList.add('is-invalid');
                validationState.username = false;
            }
        } else {
            usernameInput.classList.remove('is-valid', 'is-invalid');
            validationState.username = false;
        }
        
        // Update tooltip content if visible
        updateTooltipContent(usernameTooltip, getUsernameValidationContent);
    }

    /**
     * Validate email
     */
    function validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (value.length > 0) {
            if (emailRegex.test(value)) {
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
                validationState.email = true;
            } else {
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
                validationState.email = false;
            }
        } else {
            emailInput.classList.remove('is-valid', 'is-invalid');
            validationState.email = false;
        }
    }

    /**
     * Validate password
     */
    function validatePassword(value) {
        const hasValidLength = value.length >= 6 && value.length <= 15;
        const hasUppercase = /[A-Z]/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[\W_]/.test(value);
        
        const isPasswordValid = hasValidLength && hasUppercase && hasLowercase && hasNumber && hasSpecial;
        
        // Update input styling
        if (value.length > 0) {
            if (isPasswordValid) {
                passwordInput.classList.remove('is-invalid');
                passwordInput.classList.add('is-valid');
                validationState.password = true;
            } else {
                passwordInput.classList.remove('is-valid');
                passwordInput.classList.add('is-invalid');
                validationState.password = false;
            }
        } else {
            passwordInput.classList.remove('is-valid', 'is-invalid');
            validationState.password = false;
        }
        
        // Update tooltip content if visible
        updateTooltipContent(passwordTooltip, getPasswordValidationContent);
    }

    /**
     * Validate confirm password
     */
    function validateConfirmPassword(value) {
        const passwordValue = passwordInput.value;
        const passwordsMatch = value === passwordValue && passwordValue.length > 0 && validationState.password;
        
        // Update input styling
        if (value.length > 0) {
            if (passwordsMatch) {
                confirmPasswordInput.classList.remove('is-invalid');
                confirmPasswordInput.classList.add('is-valid');
                validationState.confirmPassword = true;
            } else {
                confirmPasswordInput.classList.remove('is-valid');
                confirmPasswordInput.classList.add('is-invalid');
                validationState.confirmPassword = false;
            }
        } else {
            confirmPasswordInput.classList.remove('is-valid', 'is-invalid');
            validationState.confirmPassword = false;
        }
        
        // Update tooltip content if visible
        updateTooltipContent(confirmPasswordTooltip, getConfirmPasswordValidationContent);
    }

    // Initialize Bootstrap tooltips
    usernameTooltip = new bootstrap.Tooltip(usernameInput, {
        title: getUsernameValidationContent(),
        html: true,
        placement: 'right',
        trigger: 'focus',
        customClass: 'validation-tooltip'
    });

    passwordTooltip = new bootstrap.Tooltip(passwordInput, {
        title: getPasswordValidationContent(),
        html: true,
        placement: 'right',
        trigger: 'focus',
        customClass: 'validation-tooltip'
    });

    confirmPasswordTooltip = new bootstrap.Tooltip(confirmPasswordInput, {
        title: getConfirmPasswordValidationContent(),
        html: true,
        placement: 'right',
        trigger: 'focus',
        customClass: 'validation-tooltip'
    });

    // Username events
    usernameInput.addEventListener('input', function() {
        validateUsername(this.value);
        updateSubmitButton();
    });

    // Email events
    emailInput.addEventListener('input', function() {
        validateEmail(this.value);
        updateSubmitButton();
    });

    // Password events
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
        
        // Re-validate confirm password if it has content
        if (confirmPasswordInput.value.length > 0) {
            validateConfirmPassword(confirmPasswordInput.value);
        }
        
        updateSubmitButton();
    });

    // Confirm password events
    confirmPasswordInput.addEventListener('input', function() {
        validateConfirmPassword(this.value);
        updateSubmitButton();
    });

    // Update tooltip content when showing
    usernameInput.addEventListener('show.bs.tooltip', function() {
        usernameTooltip.setContent({ '.tooltip-inner': getUsernameValidationContent() });
    });

    passwordInput.addEventListener('show.bs.tooltip', function() {
        passwordTooltip.setContent({ '.tooltip-inner': getPasswordValidationContent() });
    });

    confirmPasswordInput.addEventListener('show.bs.tooltip', function() {
        // Only show tooltip if password has content
        if (passwordInput.value.length === 0) {
            confirmPasswordTooltip.hide();
            return;
        }
        confirmPasswordTooltip.setContent({ '.tooltip-inner': getConfirmPasswordValidationContent() });
    });

    // Handle form submission
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        // Hide all tooltips
        [usernameTooltip, passwordTooltip, confirmPasswordTooltip].forEach(tooltip => {
            if (tooltip) tooltip.hide();
        });
        
        // Additional validation before submit
        if (!Object.values(validationState).every(state => state === true)) {
            e.preventDefault();
            
            showAlert('<i class="bi bi-exclamation-triangle"></i> Please fix all validation errors before submitting.', 'danger');
            return false;
        }
        
        // Show loading state
        submitBtn.classList.add('btn-loading');
        const originalContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>' + originalContent + '</span>';
    });

    // Initialize submit button state
    updateSubmitButton();
});

/**
 * Show alert function
 */
function showAlert(message, type = 'light') {
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed bottom-0 end-0 m-3`;
    alertDiv.style.zIndex = "1060";
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.classList.remove('show');
            alertDiv.addEventListener('transitionend', () => {
                if (alertDiv.parentNode) {
                    alertDiv.remove();
                }
            });
        }
    }, 5000);
}