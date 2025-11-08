
        document.addEventListener('DOMContentLoaded', function() {
            // Tab functionality
            const tabBtns = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');
            
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all tabs
                    tabBtns.forEach(b => b.classList.remove('active'));
                    tabContents.forEach(c => c.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    btn.classList.add('active');
                    const tabId = btn.dataset.tab;
                    document.getElementById(`${tabId}Tab`).classList.add('active');
                    
                    // Reset both tools when switching tabs
                    resetMergeTool();
                    resetSplitTool();
                });
            });
            
            // Merge PDF functionality
            const fileInput = document.getElementById('fileInput');
            const uploadArea = document.getElementById('uploadArea');
            const pdfList = document.getElementById('pdfList');
            const mergeBtn = document.getElementById('mergeBtn');
            const resetBtn = document.getElementById('resetBtn');
            const spinner = document.getElementById('spinner');
            const results = document.getElementById('results');
            const downloadBtn = document.getElementById('downloadBtn');
            
            let pdfFiles = [];
            let dragItem = null;
            let mergedPdfBytes = null;
            
            // Initialize merge tool
            initUploadArea();
            initDragAndDrop();
            
            function initUploadArea() {
                uploadArea.addEventListener('click', () => fileInput.click());
                
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('active');
                });
                
                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.classList.remove('active');
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('active');
                    if (e.dataTransfer.files.length) {
                        handleFiles(e.dataTransfer.files);
                    }
                });
                
                fileInput.addEventListener('change', () => {
                    if (fileInput.files.length) {
                        handleFiles(fileInput.files);
                    }
                });
            }
            
            function handleFiles(files) {
                let validFiles = 0;
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                        pdfFiles.push(file);
                        validFiles++;
                    }
                }
                
                if (validFiles > 0) {
                    renderPdfList();
                } else {
                    alert('Please upload valid PDF files only.');
                }
                
                fileInput.value = '';
            }
            
            function renderPdfList() {
                if (pdfFiles.length === 0) {
                    pdfList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-file-pdf" style="font-size: 2.5rem; margin-bottom: 15px;"></i>
                            <p>No PDF files added yet</p>
                        </div>
                    `;
                    return;
                }
                
                pdfList.innerHTML = '';
                
                pdfFiles.forEach((file, index) => {
                    const pdfItem = document.createElement('div');
                    pdfItem.className = 'pdf-item';
                    pdfItem.draggable = true;
                    pdfItem.dataset.index = index;
                    
                    pdfItem.innerHTML = `
                        <div class="pdf-icon">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <div class="pdf-info">
                            <h4>${file.name}</h4>
                            <p>${formatFileSize(file.size)}</p>
                        </div>
                        <div class="pdf-actions">
                            <button class="action-btn preview-btn" data-index="${index}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn delete-btn" data-index="${index}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    
                    pdfList.appendChild(pdfItem);
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = e.currentTarget.dataset.index;
                        pdfFiles.splice(index, 1);
                        renderPdfList();
                    });
                });
                
                document.querySelectorAll('.preview-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const index = e.currentTarget.dataset.index;
                        previewPdf(pdfFiles[index]);
                    });
                });
            }
            
            function initDragAndDrop() {
                pdfList.addEventListener('dragstart', (e) => {
                    if (e.target.classList.contains('pdf-item')) {
                        dragItem = e.target;
                        setTimeout(() => {
                            dragItem.classList.add('dragging');
                        }, 0);
                    }
                });
                
                pdfList.addEventListener('dragend', () => {
                    if (dragItem) {
                        dragItem.classList.remove('dragging');
                        dragItem = null;
                        updatePdfOrder();
                    }
                });
                
                pdfList.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!dragItem) return;
                    
                    const afterElement = getDragAfterElement(pdfList, e.clientY);
                    const currentItem = document.querySelector('.dragging');
                    
                    if (afterElement == null) {
                        pdfList.appendChild(currentItem);
                    } else {
                        pdfList.insertBefore(currentItem, afterElement);
                    }
                });
            }
            
            function getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('.pdf-item:not(.dragging)')];
                
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    
                    if (offset < 0 && offset > closest.offset) {
                        return { offset: offset, element: child };
                    } else {
                        return closest;
                    }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }
            
            function updatePdfOrder() {
                const newPdfFiles = [];
                document.querySelectorAll('.pdf-item').forEach(item => {
                    const index = item.dataset.index;
                    newPdfFiles.push(pdfFiles[index]);
                });
                pdfFiles = newPdfFiles;
                
                document.querySelectorAll('.pdf-item').forEach((item, index) => {
                    item.dataset.index = index;
                });
            }
            
            function previewPdf(file) {
                const pdfUrl = URL.createObjectURL(file);
                window.open(pdfUrl, '_blank');
            }
            
            async function mergePdfs(pdfFiles) {
                const { PDFDocument } = PDFLib;
                const mergedPdf = await PDFDocument.create();
                
                for (const pdfFile of pdfFiles) {
                    try {
                        const pdfBytes = await pdfFile.arrayBuffer();
                        const pdfDoc = await PDFDocument.load(pdfBytes);
                        
                        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                        pages.forEach(page => mergedPdf.addPage(page));
                    } catch (err) {
                        console.error(`Error processing ${pdfFile.name}:`, err);
                        throw new Error(`Failed to process ${pdfFile.name}. It may be corrupted or password protected.`);
                    }
                }
                
                return await mergedPdf.save();
            }
            
            function getMergedFilename() {
                if (pdfFiles.length === 1) {
                    return pdfFiles[0].name.replace('.pdf', '-merged.pdf');
                }
                const baseName = pdfFiles[0].name.split('.')[0];
                return `${baseName}-merged-${new Date().getTime()}.pdf`;
            }
            
            mergeBtn.addEventListener('click', async function() {
                if (pdfFiles.length === 0) {
                    alert('Please add at least one PDF file.');
                    return;
                }
                
                spinner.style.display = 'block';
                mergeBtn.disabled = true;
                mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging...';
                results.style.display = 'none';
                
                try {
                    mergedPdfBytes = await mergePdfs(pdfFiles);
                    downloadBtn.download = getMergedFilename();
                    results.style.display = 'block';
                } catch (error) {
                    console.error("Merge error:", error);
                    alert("Failed to merge PDFs: " + error.message);
                } finally {
                    spinner.style.display = 'none';
                    mergeBtn.disabled = false;
                    mergeBtn.innerHTML = '<i class="fas fa-object-group"></i> Merge PDFs';
                }
            });
            
            downloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (mergedPdfBytes) {
                    download(mergedPdfBytes, downloadBtn.download, 'application/pdf');
                } else {
                    alert('No merged PDF available. Please merge files first.');
                }
            });
            
            resetBtn.addEventListener('click', resetMergeTool);
            
            function resetMergeTool() {
                pdfFiles = [];
                mergedPdfBytes = null;
                fileInput.value = '';
                renderPdfList();
                results.style.display = 'none';
            }
            
            // Split PDF functionality
            const splitFileInput = document.getElementById('splitFileInput');
            const splitUploadArea = document.getElementById('splitUploadArea');
            const splitControls = document.getElementById('splitControls');
            const startPage = document.getElementById('startPage');
            const endPage = document.getElementById('endPage');
            const splitRangeBtn = document.getElementById('splitRangeBtn');
            const splitAllBtn = document.getElementById('splitAllBtn');
            const splitSelectedBtn = document.getElementById('splitSelectedBtn');
            const pagePreview = document.getElementById('pagePreview');
            const splitSpinner = document.getElementById('splitSpinner');
            const splitResults = document.getElementById('splitResults');
            const downloadSplitBtn = document.getElementById('downloadSplitBtn');
            const splitResultTitle = document.getElementById('splitResultTitle');
            const splitResultMessage = document.getElementById('splitResultMessage');
            
            let splitPdfFile = null;
            let totalPages = 0;
            let selectedPages = [];
            let splitResult = null;
            let isZipFile = false;
            
            // Initialize split tool
            splitUploadArea.addEventListener('click', () => splitFileInput.click());
            
            splitUploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                splitUploadArea.classList.add('active');
            });
            
            splitUploadArea.addEventListener('dragleave', () => {
                splitUploadArea.classList.remove('active');
            });
            
            splitUploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                splitUploadArea.classList.remove('active');
                if (e.dataTransfer.files.length) {
                    handleSplitFile(e.dataTransfer.files[0]);
                }
            });
            
            splitFileInput.addEventListener('change', () => {
                if (splitFileInput.files.length) {
                    handleSplitFile(splitFileInput.files[0]);
                }
            });
            
            function handleSplitFile(file) {
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    splitPdfFile = file;
                    loadPdfForSplitting();
                } else {
                    alert('Please upload a valid PDF file.');
                }
            }
            
            async function loadPdfForSplitting() {
                splitSpinner.style.display = 'block';
                splitControls.style.display = 'none';
                splitResults.style.display = 'none';
                
                try {
                    const pdfBytes = await splitPdfFile.arrayBuffer();
                    const { PDFDocument } = PDFLib;
                    const pdfDoc = await PDFDocument.load(pdfBytes);
                    
                    totalPages = pdfDoc.getPageCount();
                    splitSpinner.style.display = 'none';
                    splitControls.style.display = 'block';
                    
                    // Initialize page range inputs
                    startPage.value = 1;
                    endPage.value = totalPages;
                    startPage.max = totalPages;
                    endPage.max = totalPages;
                    
                    // Generate page preview
                    renderPagePreview();
                } catch (error) {
                    console.error("Error loading PDF:", error);
                    alert("Failed to load PDF: " + error.message);
                    splitSpinner.style.display = 'none';
                }
            }
            
            function renderPagePreview() {
                pagePreview.innerHTML = '';
                selectedPages = [];
                
                for (let i = 1; i <= totalPages; i++) {
                    const pageItem = document.createElement('div');
                    pageItem.className = 'page-item';
                    pageItem.dataset.page = i;
                    
                    pageItem.innerHTML = `
                        <i class="fas fa-file-pdf" style="font-size: 2rem; color: #4a6bff; margin-bottom: 5px;"></i>
                        <div class="page-number">Page ${i}</div>
                    `;
                    
                    pageItem.addEventListener('click', () => {
                        pageItem.classList.toggle('selected');
                        const pageNum = parseInt(pageItem.dataset.page);
                        
                        if (pageItem.classList.contains('selected')) {
                            selectedPages.push(pageNum);
                        } else {
                            selectedPages = selectedPages.filter(p => p !== pageNum);
                        }
                    });
                    
                    pagePreview.appendChild(pageItem);
                }
            }
            
            splitRangeBtn.addEventListener('click', async function() {
                const start = parseInt(startPage.value) || 1;
                const end = parseInt(endPage.value) || totalPages;
                
                if (start < 1 || start > totalPages || end < 1 || end > totalPages || start > end) {
                    alert('Please enter a valid page range.');
                    return;
                }
                
                await splitPdfByRange(start, end);
            });
            
            splitAllBtn.addEventListener('click', async function() {
                await splitAllPages();
            });
            
            splitSelectedBtn.addEventListener('click', async function() {
                if (selectedPages.length === 0) {
                    alert('Please select at least one page to split.');
                    return;
                }
                
                await splitSelectedPages();
            });
            
            async function splitPdfByRange(start, end) {
                splitSpinner.style.display = 'block';
                splitResults.style.display = 'none';
                
                try {
                    const pdfBytes = await splitPdfFile.arrayBuffer();
                    const { PDFDocument } = PDFLib;
                    const pdfDoc = await PDFDocument.load(pdfBytes);
                    
                    const newPdf = await PDFDocument.create();
                    const pageIndices = Array.from({length: end - start + 1}, (_, i) => start - 1 + i);
                    
                    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
                    pages.forEach(page => newPdf.addPage(page));
                    
                    splitResult = await newPdf.save();
                    isZipFile = false;
                    
                    splitResultTitle.textContent = 'Your PDF is ready!';
                    splitResultMessage.textContent = `Pages ${start}-${end} extracted successfully`;
                    downloadSplitBtn.innerHTML = '<i class="fas fa-download"></i> Download Split PDF';
                    downloadSplitBtn.download = `${splitPdfFile.name.replace('.pdf', '')}-pages-${start}-${end}.pdf`;
                    splitResults.style.display = 'block';
                } catch (error) {
                    console.error("Split error:", error);
                    alert("Failed to split PDF: " + error.message);
                } finally {
                    splitSpinner.style.display = 'none';
                }
            }
            
            async function splitSelectedPages() {
                splitSpinner.style.display = 'block';
                splitResults.style.display = 'none';
                
                try {
                    const pdfBytes = await splitPdfFile.arrayBuffer();
                    const { PDFDocument } = PDFLib;
                    const pdfDoc = await PDFDocument.load(pdfBytes);
                    
                    const newPdf = await PDFDocument.create();
                    const pageIndices = selectedPages.map(p => p - 1).sort((a, b) => a - b);
                    
                    const pages = await newPdf.copyPages(pdfDoc, pageIndices);
                    pages.forEach(page => newPdf.addPage(page));
                    
                    splitResult = await newPdf.save();
                    isZipFile = false;
                    
                    splitResultTitle.textContent = 'Your PDF is ready!';
                    splitResultMessage.textContent = `${selectedPages.length} pages extracted successfully`;
                    downloadSplitBtn.innerHTML = '<i class="fas fa-download"></i> Download Split PDF';
                    downloadSplitBtn.download = `${splitPdfFile.name.replace('.pdf', '')}-selected-pages.pdf`;
                    splitResults.style.display = 'block';
                } catch (error) {
                    console.error("Split error:", error);
                    alert("Failed to split PDF: " + error.message);
                } finally {
                    splitSpinner.style.display = 'none';
                }
            }
            
            async function splitAllPages() {
                splitSpinner.style.display = 'block';
                splitResults.style.display = 'none';
                
                try {
                    const pdfBytes = await splitPdfFile.arrayBuffer();
                    const { PDFDocument } = PDFLib;
                    const pdfDoc = await PDFDocument.load(pdfBytes);
                    
                    const zip = new JSZip();
                    
                    for (let i = 0; i < totalPages; i++) {
                        const newPdf = await PDFDocument.create();
                        const [page] = await newPdf.copyPages(pdfDoc, [i]);
                        newPdf.addPage(page);
                        
                        const pdfBytes = await newPdf.save();
                        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                        zip.file(`page-${i+1}.pdf`, blob);
                    }
                    
                    const zipContent = await zip.generateAsync({ type: 'blob' });
                    splitResult = zipContent;
                    isZipFile = true;
                    
                    splitResultTitle.textContent = 'Your PDFs are ready!';
                    splitResultMessage.textContent = `${totalPages} pages split into separate files`;
                    downloadSplitBtn.innerHTML = '<i class="fas fa-download"></i> Download All Pages (ZIP)';
                    downloadSplitBtn.download = `${splitPdfFile.name.replace('.pdf', '')}-all-pages.zip`;
                    splitResults.style.display = 'block';
                } catch (error) {
                    console.error("Split error:", error);
                    alert("Failed to split PDF: " + error.message);
                } finally {
                    splitSpinner.style.display = 'none';
                }
            }
            
            downloadSplitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (splitResult) {
                    if (isZipFile) {
                        saveAs(splitResult, downloadSplitBtn.download);
                    } else {
                        download(splitResult, downloadSplitBtn.download, 'application/pdf');
                    }
                } else {
                    alert('No split result available. Please split a PDF first.');
                }
            });
            
            function resetSplitTool() {
                splitPdfFile = null;
                totalPages = 0;
                selectedPages = [];
                splitResult = null;
                isZipFile = false;
                splitFileInput.value = '';
                splitControls.style.display = 'none';
                splitResults.style.display = 'none';
                pagePreview.innerHTML = '';
            }
            
            // Common functions
            function formatFileSize(bytes) {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            }
        });

        //02-10-2025 Mobile Menu Toggle
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
    

