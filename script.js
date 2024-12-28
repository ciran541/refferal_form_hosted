document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('referralForm');
    
    // Add loading spinner and feedback message to HTML if not already present
    if (!document.querySelector('.loading-spinner')) {
        const spinnerHtml = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
            <div class="feedback-message"></div>
        `;
        document.body.insertAdjacentHTML('beforeend', spinnerHtml);
    }
    
    const loadingSpinner = document.querySelector('.loading-spinner');
    const feedbackMessage = document.querySelector('.feedback-message');
    
    // Validation rules
    const validators = {
        email: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        phone: {
            regex: /^\+?[\d\s-]{8,}$/,
            message: 'Please enter a valid phone number'
        },
        required: {
            test: value => value.trim().length > 0,
            message: 'This field is required'
        }
    };

    //showFeedback function
function showFeedback(message, isSuccess) {
    const feedbackMessage = document.querySelector('.feedback-message');
    if (feedbackMessage) {
        feedbackMessage.textContent = message;
        feedbackMessage.className = 'feedback-message ' + 
            (isSuccess ? 'feedback-success' : 'feedback-error');
        feedbackMessage.style.bottom = '20px';
        feedbackMessage.style.display = 'block'; // Make sure it's visible
        
        setTimeout(() => {
            feedbackMessage.style.bottom = '-100px';
        }, 5000);
    }
}
    // Show/hide loading spinner
    function toggleLoading(show) {
    const loadingSpinner = document.querySelector('.loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }
}

    // Show error message
    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup.querySelector('.error-message');
        const wrapper = input.closest('.input-wrapper');
        
        if (wrapper) {
            wrapper.classList.add('error');
        }
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.add('visible');
        }
    }

    // Clear error message
    function clearError(input) {
        const formGroup = input.closest('.form-group');
        const errorDiv = formGroup.querySelector('.error-message');
        const wrapper = input.closest('.input-wrapper');
        
        if (wrapper) {
            wrapper.classList.remove('error');
        }
        
        if (errorDiv) {
            errorDiv.classList.remove('visible');
            errorDiv.textContent = '';
        }
    }



    // Validate radio group
    function validateRadioGroup(name) {
        const firstRadio = form.querySelector(`input[name="${name}"]`);
        if (!firstRadio) return true;
        
        const radioGroup = firstRadio.closest('.form-group');
        const radioButtons = form.querySelectorAll(`input[name="${name}"]`);
        const errorDiv = radioGroup.querySelector('.error-message');
        
        let isChecked = false;
        radioButtons.forEach(radio => {
            if (radio.checked) isChecked = true;
        });

        if (!isChecked) {
            if (errorDiv) {
                errorDiv.textContent = 'Please select an option';
                errorDiv.style.display = 'block';
            }
            return false;
        } else {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            return true;
        }
    }

    // Validate checkbox
    function validateCheckbox(checkbox) {
        const consentCheckbox = checkbox.closest('.consent-checkbox');
        
        if (!checkbox.checked) {
            if (consentCheckbox) {
                const errorDiv = consentCheckbox.querySelector('.error-message');
                if (errorDiv) {
                    errorDiv.textContent = 'Please accept the terms and conditions';
                    errorDiv.style.display = 'block';
                }
                consentCheckbox.classList.add('error');
            }
            return false;
        }
        
        if (consentCheckbox) {
            const errorDiv = consentCheckbox.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
            consentCheckbox.classList.remove('error');
        }
        return true;
    }

    // Validate single field
    function validateField(input) {
        if (input.type === 'radio') {
            return validateRadioGroup(input.name);
        }

        if (input.type === 'checkbox') {
            return validateCheckbox(input);
        }

        clearError(input);

        if (input.required && !validators.required.test(input.value)) {
            showError(input, validators.required.message);
            return false;
        }

        if (input.type === 'email' && input.value) {
            if (!validators.email.regex.test(input.value)) {
                showError(input, validators.email.message);
                return false;
            }
        }

        if (input.type === 'tel' && input.value) {
            if (!validators.phone.regex.test(input.value)) {
                showError(input, validators.phone.message);
                return false;
            }
        }

        return true;
    }

    // Update just this function in your existing JavaScript
async function submitToGoogleSheets(formData) {
    try {
        const formDataObj = Object.fromEntries(formData);
        
        const response = await fetch('submit-form.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formDataObj)
        });

        const result = await response.json();
        console.log('Server response:', result); // For debugging

        if (result && result.status === 'success') {
            showFeedback('Thank you for enquiring, we will be in touch as soon as possible.!', true);
            form.reset();
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Submission error:', error);
        showFeedback('Error submitting form. Please try again.', false);
    } finally {
        toggleLoading(false);
    }
}

    // Form submit handler
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        let isValid = true;

        // Validate all inputs
        form.querySelectorAll('input').forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            toggleLoading(true);
            
            const formData = new FormData(form);
            await submitToGoogleSheets(formData);
            
            toggleLoading(false);
        }
    });

    // Real-time validation
    form.querySelectorAll('input').forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.addEventListener('input', function() {
                clearError(input);
            });

            input.addEventListener('blur', function() {
                validateField(input);
            });
        }
    });

    // Radio button validation
    form.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            validateRadioGroup(this.name);
        });
    });
});