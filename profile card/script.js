// Student Registration Portal - Main Application
class StudentRegistration {
    constructor() {
        this.students = [];
        this.filteredStudents = [];
        this.editingIndex = -1;
        this.init();
    }

    // Initialize the application
    init() {
        this.bindEvents();
        this.loadFromStorage();
        this.updateUI();
        this.setupAccessibility();
    }

    // Event Listeners
    bindEvents() {
        // Form submission
        const form = document.getElementById('registration-form');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearError(e.target));
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    // Form Validation
    validateField(field) {
        const { name, value, type } = field;
        const errorElement = document.getElementById(`${name}-error`);
        let isValid = true;
        let message = '';

        // Clear previous state
        field.classList.remove('error', 'valid');

        switch (name) {
            case 'firstName':
            case 'lastName':
                if (!value.trim()) {
                    message = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
                    isValid = false;
                } else if (value.trim().length < 2) {
                    message = `Must be at least 2 characters long`;
                    isValid = false;
                } else if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) {
                    message = 'Only letters, spaces, apostrophes, and hyphens allowed';
                    isValid = false;
                }
                break;

            case 'email':
                if (!value.trim()) {
                    message = 'Email address is required';
                    isValid = false;
                } else if (!this.isValidEmail(value)) {
                    message = 'Please enter a valid email address';
                    isValid = false;
                } else if (this.isEmailTaken(value, this.editingIndex)) {
                    message = 'This email is already registered';
                    isValid = false;
                }
                break;

            case 'programme':
                if (!value) {
                    message = 'Please select your programme';
                    isValid = false;
                }
                break;

            case 'year':
                if (!value) {
                    message = 'Please select your academic year';
                    isValid = false;
                }
                break;

            case 'photoUrl':
                if (value.trim() && !this.isValidUrl(value)) {
                    message = 'Please enter a valid URL';
                    isValid = false;
                }
                break;
        }

        // Update UI
        if (errorElement) {
            errorElement.textContent = message;
        }

        if (isValid && value.trim()) {
            field.classList.add('valid');
        } else if (!isValid) {
            field.classList.add('error');
        }

        return isValid;
    }

    clearError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.name}-error`);
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    validateForm() {
        const form = document.getElementById('registration-form');
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate optional photo URL
        const photoUrl = document.getElementById('photoUrl');
        if (photoUrl.value.trim()) {
            if (!this.validateField(photoUrl)) {
                isValid = false;
            }
        }

        return isValid;
    }

    // Utility Functions
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isEmailTaken(email, excludeIndex = -1) {
        return this.students.some((student, index) => 
            student.email.toLowerCase() === email.toLowerCase() && index !== excludeIndex
        );
    }

    // Form Handling
    handleSubmit(e) {
        e.preventDefault();

        if (!this.validateForm()) {
            this.announce('Please correct the errors in the form');
            return;
        }

        const formData = new FormData(e.target);
        const studentData = {
            id: this.editingIndex >= 0 ? this.students[this.editingIndex].id : Date.now(),
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            email: formData.get('email').trim(),
            programme: formData.get('programme'),
            year: formData.get('year'),
            interests: formData.get('interests').trim() || 'No specific interests mentioned',
            photoUrl: formData.get('photoUrl').trim(),
            createdAt: this.editingIndex >= 0 ? this.students[this.editingIndex].createdAt : new Date().toISOString()
        };

        if (this.editingIndex >= 0) {
            this.updateStudent(this.editingIndex, studentData);
            this.announce(`Profile updated for ${studentData.firstName} ${studentData.lastName}`);
        } else {
            this.addStudent(studentData);
            this.announce(`Profile created for ${studentData.firstName} ${studentData.lastName}`);
        }

        this.resetForm();
        this.saveToStorage();
        this.updateUI();
    }

    resetForm() {
        const form = document.getElementById('registration-form');
        form.reset();
        
        // Clear validation states
        const fields = form.querySelectorAll('.error, .valid');
        fields.forEach(field => field.classList.remove('error', 'valid'));

        const errors = form.querySelectorAll('.error-message');
        errors.forEach(error => error.textContent = '');

        // Reset editing state
        this.editingIndex = -1;
        const submitBtn = form.querySelector('.btn-primary .btn-text');
        submitBtn.textContent = 'Create Profile';
    }

    // Student Management
    addStudent(studentData) {
        this.students.push(studentData);
    }

    updateStudent(index, studentData) {
        if (index >= 0 && index < this.students.length) {
            this.students[index] = studentData;
        }
    }

    removeStudent(index) {
        if (index >= 0 && index < this.students.length) {
            const student = this.students[index];
            if (confirm(`Remove ${student.firstName} ${student.lastName}'s profile? This cannot be undone.`)) {
                this.students.splice(index, 1);
                this.announce(`Profile removed for ${student.firstName} ${student.lastName}`);
                this.saveToStorage();
                this.updateUI();
            }
        }
    }

    editStudent(index) {
        if (index >= 0 && index < this.students.length) {
            const student = this.students[index];
            this.populateForm(student);
            this.editingIndex = index;
            
            const submitBtn = document.querySelector('.btn-primary .btn-text');
            submitBtn.textContent = 'Update Profile';
            
            // Smooth scroll to form
            document.querySelector('.form-card').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            this.announce(`Editing profile for ${student.firstName} ${student.lastName}`);
        }
    }

    populateForm(student) {
        document.getElementById('firstName').value = student.firstName;
        document.getElementById('lastName').value = student.lastName;
        document.getElementById('email').value = student.email;
        document.getElementById('programme').value = student.programme;
        document.getElementById('year').value = student.year;
        document.getElementById('interests').value = student.interests === 'No specific interests mentioned' ? '' : student.interests;
        document.getElementById('photoUrl').value = student.photoUrl || '';
    }

    // Search and Filter
    handleSearch(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.filteredStudents = [...this.students];
        } else {
            this.filteredStudents = this.students.filter(student => {
                return (
                    student.firstName.toLowerCase().includes(searchTerm) ||
                    student.lastName.toLowerCase().includes(searchTerm) ||
                    student.email.toLowerCase().includes(searchTerm) ||
                    student.programme.toLowerCase().includes(searchTerm) ||
                    student.year.toLowerCase().includes(searchTerm) ||
                    student.interests.toLowerCase().includes(searchTerm)
                );
            });
        }
        
        this.renderProfiles();
    }

    // UI Updates
    updateUI() {
        this.filteredStudents = [...this.students];
        this.updateCounter();
        this.renderProfiles();
        this.renderTable();
        this.toggleSearch();
    }

    updateCounter() {
        const counter = document.getElementById('profile-count');
        counter.textContent = this.students.length;
    }

    toggleSearch() {
        const searchContainer = document.getElementById('search-container');
        searchContainer.style.display = this.students.length > 0 ? 'block' : 'none';
    }

    renderProfiles() {
        const container = document.getElementById('profile-cards');
        
        if (this.filteredStudents.length === 0) {
            if (this.students.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">👥</div>
                        <h3>No profiles yet</h3>
                        <p>Create your first student profile using the form</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No matches found</h3>
                        <p>Try adjusting your search criteria</p>
                    </div>
                `;
            }
            return;
        }

        container.innerHTML = this.filteredStudents.map((student, filteredIndex) => {
            const actualIndex = this.students.findIndex(s => s.id === student.id);
            return this.createProfileCard(student, actualIndex);
        }).join('');
    }

    createProfileCard(student, index) {
        const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
        const fullName = `${student.firstName} ${student.lastName}`;
        
        const avatarHtml = student.photoUrl 
            ? `<img src="${student.photoUrl}" alt="${fullName}" class="profile-avatar" 
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        
        const placeholderHtml = `<div class="profile-avatar placeholder" ${student.photoUrl ? 'style="display:none"' : ''}>${initials}</div>`;

        return `
            <div class="profile-card" data-student-id="${student.id}">
                <div class="profile-header">
                    ${avatarHtml}
                    ${placeholderHtml}
                    <div class="profile-info">
                        <h3>${fullName}</h3>
                        <div class="profile-email">${student.email}</div>
                    </div>
                </div>
                
                <div class="profile-details">
                    <div class="detail-item">
                        <div class="detail-label">Programme</div>
                        <div class="detail-value">${student.programme}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Year</div>
                        <div class="detail-value">${student.year}</div>
                    </div>
                </div>
                
                ${student.interests && student.interests !== 'No specific interests mentioned' ? `
                    <div class="profile-interests">
                        <div class="detail-label">Interests</div>
                        <div class="interests-text">${student.interests}</div>
                    </div>
                ` : ''}
                
                <div class="profile-actions">
                    <button type="button" class="btn btn-secondary btn-sm" 
                            onclick="app.editStudent(${index})" 
                            aria-label="Edit profile for ${fullName}">
                        Edit
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" 
                            onclick="app.removeStudent(${index})" 
                            aria-label="Remove profile for ${fullName}">
                        Remove
                    </button>
                </div>
            </div>
        `;
    }

    renderTable() {
        const tbody = document.getElementById('table-body');
        const emptyState = document.getElementById('table-empty');
        
        if (this.students.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        tbody.innerHTML = this.students.map((student, index) => `
            <tr>
                <td>${student.firstName} ${student.lastName}</td>
                <td>${student.email}</td>
                <td>${student.programme}</td>
                <td>${student.year}</td>
                <td class="table-actions">
                    <button type="button" class="btn btn-secondary btn-sm" 
                            onclick="app.editStudent(${index})" 
                            aria-label="Edit ${student.firstName} ${student.lastName}">
                        Edit
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" 
                            onclick="app.removeStudent(${index})" 
                            aria-label="Remove ${student.firstName} ${student.lastName}">
                        Remove
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Local Storage
    saveToStorage() {
        try {
            localStorage.setItem('studentRegistrations', JSON.stringify(this.students));
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('studentRegistrations');
            if (saved) {
                this.students = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
            this.students = [];
        }
    }

    // Accessibility
    setupAccessibility() {
        // Enhanced focus management
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('input, select, textarea, button')) {
                e.target.style.outline = '2px solid var(--primary)';
                e.target.style.outlineOffset = '2px';
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('input, select, textarea, button')) {
                e.target.style.outline = '';
                e.target.style.outlineOffset = '';
            }
        });
    }

    handleKeyboard(e) {
        // Escape key cancels editing
        if (e.key === 'Escape' && this.editingIndex >= 0) {
            this.resetForm();
            this.announce('Profile editing cancelled');
        }
    }

    announce(message) {
        const announcer = document.getElementById('announcements');
        announcer.textContent = message;
        
        // Clear after delay to reset live region
        setTimeout(() => {
            announcer.textContent = '';
        }, 1000);
    }
}

// Initialize Application
const app = new StudentRegistration();

// Global Error Handler
window.addEventListener('error', (event) => {
    console.error('Application error:', event.error);
    app.announce('An error occurred. Please try again.');
});

// Performance optimization - lazy load images
document.addEventListener('DOMContentLoaded', () => {
    // Add intersection observer for profile images if needed
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });

        // Observe profile images when they're added
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        const images = node.querySelectorAll('img[data-src]');
                        images.forEach(img => imageObserver.observe(img));
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }
});