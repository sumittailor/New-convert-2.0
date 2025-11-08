
        // Mobile Menu Toggle
        document.querySelector('.mobile-menu').addEventListener('click', function() {
            document.querySelector('.nav-menu').classList.toggle('active');
        });

        // Dark Mode Toggle
        document.querySelector('.dark-mode-toggle').addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const icon = this.querySelector('i');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });

        // Tab Navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                // Remove active class from all tabs and content
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Tool Card Interactions
        document.querySelectorAll('.tool-card .btn').forEach(button => {
            button.addEventListener('click', function() {
                const toolName = this.parentElement.querySelector('h3').textContent;
                alert(`You selected: ${toolName}\n\nThis would open the tool interface in a real application.`);
            });
        });

        // Search Functionality
        document.querySelector('.search-box button').addEventListener('click', function() {
            const searchTerm = document.querySelector('.search-box input').value;
            if (searchTerm.trim() !== '') {
                alert(`Searching for: ${searchTerm}\n\nIn a real application, this would filter the tools.`);
            }
        });

        // CTA Button
        document.querySelector('.cta .btn').addEventListener('click', function() {
            alert('Exploring all tools...\n\nThis would navigate to the tools page.');
        });
    