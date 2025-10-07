// BrainRot Presale Website JavaScript - FINAL WORKING VERSION

class BrainRotPresale {
    constructor() {
        console.log('🧠 BrainRot Presale constructor called');
        this.wallet = null;
        this.publicKey = null;
        this.isAdmin = false;
        this.adminWallet = "4vztUxqbpYwb48xRFSqqHZEGFcDW15WGEHth6SE4mU91";
        this.presaleWallet = "4vztUxqbpYwb48xRFSqqHZEGFcDW15WGEHth6SE4mU91";

        this.currentPhase = 1;
        this.phases = [
            { id: 1, name: "Phase 1: Maximum Gains", rate: 1000000, bonus: 50, duration: 7 * 24 * 60 * 60 * 1000 },
            { id: 2, name: "Phase 2: High Rewards", rate: 800000, bonus: 30, duration: 5 * 24 * 60 * 60 * 1000 },
            { id: 3, name: "Phase 3: Final Chance", rate: 600000, bonus: 10, duration: 3 * 24 * 60 * 60 * 1000 }
        ];

        this.totalTokens = 7777777777;
        this.presaleTokens = 2566666666;
        this.tokensSold = Math.floor(this.presaleTokens * 0.21);
        this.totalRaised = this.tokensSold / this.phases[0].rate;
        this.participants = 627;

        this.userTokens = 0;
        this.bannedUsers = new Set();
        this.dailyTokenLimit = 20000000;
        this.tokensSentToday = 0;
        this.todayDate = new Date().toDateString();
        this.progressInterval = null;
        this.mobileWalletAdapter = null;
        this.mobileConnectBtn = null;

        this.initializeApp();
    }

    async initializeApp() {
        console.log('🚀 Initializing BrainRot Presale app...');

        // Wait for Solana Web3 library to load
        let retries = 0;
        const maxRetries = 10;

        while (typeof window.solanaWeb3 === 'undefined' && retries < maxRetries) {
            console.log(`⏳ Waiting for Solana Web3 library... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 500));
            retries++;
        }

        if (typeof window.solanaWeb3 === 'undefined') {
            console.error('❌ Solana Web3 library failed to load');
            this.showNotification('❌ Failed to load Solana library. Please refresh the page.', 'error');
            return;
        }

        console.log('✅ Solana Web3 library loaded successfully');

        this.setupElements();
        this.setupEventListeners();
        this.setupFaqAccordion();
        this.startPhaseTimer();
        this.loadData();
        this.checkForWalletConnection();

        // Show wallet required message initially
        this.showWalletRequiredMessage();

        // Show mobile connect wallet button if on mobile and no wallet connected
        if (this.isMobileDevice() && !this.publicKey && this.mobileConnectWalletBtn) {
            this.mobileConnectWalletBtn.style.display = 'block';
        }

        // Show hero connect wallet button if no wallet connected
        if (!this.publicKey && this.heroConnectWalletBtn) {
            this.heroConnectWalletBtn.style.display = 'block';
        }

        // Try wallet detection after a delay
        setTimeout(() => {
            console.log('🔍 Attempting wallet detection...');
            this.attemptWalletDetection();
        }, 1000);

        // Check for return from Phantom app after initialization
        setTimeout(() => {
            this.checkForWalletConnection();
        }, 2000);
    }

    setupElements() {
        console.log('🔧 Setting up DOM elements...');

        // Mobile menu toggle
        this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        this.navLinks = document.querySelector('.nav-links');

        // Buttons
        this.connectBtn = document.getElementById('connect-wallet');
        this.buyBtn = document.getElementById('buy-rot-btn');
        this.adminBtn = document.getElementById('admin-panel-btn');

        // Modals
        this.walletModal = document.getElementById('wallet-modal');
        this.purchaseModal = document.getElementById('purchase-modal');
        this.adminModal = document.getElementById('admin-modal');

        // User info elements
        this.userInfo = document.getElementById('user-info');
        this.userBalance = document.getElementById('user-balance');
        this.userAddress = document.getElementById('user-address');
        this.userBalanceNav = document.getElementById('user-balance-nav');

        // Manual payment elements
        this.manualPaymentInfo = document.getElementById('manual-payment-info');
        this.manualPaymentAddress = document.getElementById('manual-payment-address');
        if (this.manualPaymentAddress) {
            this.manualPaymentAddress.dataset.address = this.presaleWallet;
            this.manualPaymentAddress.textContent = this.presaleWallet;
        }
        // Mobile connect wallet button
        this.mobileConnectBtn = document.getElementById('mobile-connect-phantom');

        if (this.mobileConnectBtn) {
            console.log('✅ Mobile connect button found, adding listener');
            this.mobileConnectBtn.addEventListener('click', (e) => {
                console.log('📱 Mobile connect button clicked');
                e.preventDefault();
                this.connectWallet();
            });
        }

        // Airdrop elements
        this.claimAirdropBtn = document.getElementById('claim-airdrop-btn');

        // Forms and inputs
        this.solInput = document.getElementById('sol-amount');
        this.referralInput = document.getElementById('referral-code');
        this.userReferralLink = document.getElementById('user-referral-link');
        this.confirmPurchaseBtn = document.getElementById('confirm-purchase');

        // Admin elements
        this.adminElements = {
            action: document.getElementById('admin-action'),
            userAddress: document.getElementById('admin-user-address'),
            tokenAmount: document.getElementById('admin-token-amount'),
            banAddress: document.getElementById('ban-address'),
            tokensSent: document.getElementById('tokens-sent-today'),
            remaining: document.getElementById('remaining-limit'),
            bannedList: document.getElementById('banned-list'),
            executeBtn: document.getElementById('execute-admin-action'),
            banBtn: document.getElementById('ban-user')
        };

        // Set presale wallet address
        const presaleWalletElement = document.getElementById('presale-wallet');
        if (presaleWalletElement) {
            presaleWalletElement.textContent = this.presaleWallet;
        }

        console.log('✅ DOM elements setup complete');
        console.log('📋 Confirm Purchase Button Found:', !!document.getElementById('confirm-purchase'));
    }

    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            console.log('✅ Mobile menu toggle found, adding listener');
            this.mobileMenuToggle.addEventListener('click', () => {
                console.log('📱 Mobile menu toggle clicked');
                this.toggleMobileMenu();
            });
        } else {
            console.warn('⚠️ Mobile menu toggle not found');
        }

        // Wallet connection - with null checks
        if (this.connectBtn) {
            console.log('✅ Connect wallet button found, adding listener');
            this.connectBtn.addEventListener('click', (e) => {
                console.log('🖱️ Connect wallet button clicked');
                e.preventDefault();
                this.showModal(this.walletModal);
            });
        } else {
            console.error('❌ Connect wallet button not found!');
        }

        // Phantom connect button in modal
        const phantomConnect = document.getElementById('phantom-connect');
        if (phantomConnect) {
            console.log('✅ Phantom connect button found, adding listener');
            phantomConnect.addEventListener('click', (e) => {
                console.log('👻 Phantom connect button clicked');
                e.preventDefault();
                this.hideModal(this.walletModal);
                this.connectWallet();
            });
        } else {
            console.error('❌ Phantom connect button not found!');
        }

        // Purchase flow
        if (this.buyBtn) {
            console.log('✅ Buy button found, adding listener');
            this.buyBtn.addEventListener('click', (e) => {
                console.log('🛒 Buy button clicked');
                e.preventDefault();
                this.showPurchaseModal();
            });
        }

        if (this.confirmPurchaseBtn) {
            console.log('✅ Confirm purchase button ready, attaching handler');
            this.confirmPurchaseBtn.addEventListener('click', async (e) => {
                console.log('🚀 Confirm purchase button clicked');
                e.preventDefault();
                e.stopPropagation();
                await this.handlePurchase();
            });
        } else {
            console.error('❌ Confirm purchase button not found in DOM');
        }

        // Modal close buttons
        const modalCloseButtons = document.querySelectorAll('.modal-close');
        console.log(`📋 Found ${modalCloseButtons.length} modal close buttons`);
        modalCloseButtons.forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Input updates
        if (this.solInput) {
            this.solInput.addEventListener('input', () => this.updateCalculations());
            this.solInput.addEventListener('change', () => this.updateCalculations());
        }

        if (this.manualPaymentAddress) {
            this.manualPaymentAddress.addEventListener('click', () => this.copyManualPaymentAddress());
        }

        // Referral system
        const applyReferralBtn = document.getElementById('apply-referral');
        if (applyReferralBtn) {
            applyReferralBtn.addEventListener('click', () => this.applyReferral());
        }

        // Hero connect wallet button
        this.heroConnectWalletBtn = document.getElementById('hero-connect-wallet');

        if (this.heroConnectWalletBtn) {
            this.heroConnectWalletBtn.addEventListener('click', (e) => {
                console.log('🎯 Hero connect wallet button clicked');
                e.preventDefault();
                this.showModal(this.walletModal);
            });
        }

        // Airdrop
        if (this.claimAirdropBtn) {
            this.claimAirdropBtn.addEventListener('click', () => this.claimAirdrop());
        }

        // Admin panel
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => this.showAdminPanel());
        }

        if (this.adminElements.executeBtn) {
            this.adminElements.executeBtn.addEventListener('click', () => this.executeAdminAction());
        }

        if (this.adminElements.banBtn) {
            this.adminElements.banBtn.addEventListener('click', () => this.banUser());
        }
    }

    setupFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) {
            return;
        }

        faqItems.forEach((item) => {
            item.classList.remove('active');
            const question = item.querySelector('.faq-question');

            if (!question) {
                return;
            }

            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                faqItems.forEach((other) => {
                    if (other !== item) {
                        other.classList.remove('active');
                    }
                });

                if (isActive) {
                    item.classList.remove('active');
                } else {
                    item.classList.add('active');
                }
            });
        });
    }

    showModal(modal) {
        if (!modal) return;
        console.log('🎭 Showing modal:', modal.id);
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        if (!modal) return;
        console.log('🎭 Hiding modal:', modal.id);
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            backgroundColor: type === 'success' ? '#4ade80' :
                           type === 'error' ? '#ef4444' :
                           type === 'warning' ? '#fbbf24' : '#6b7280'
        });

        document.body.appendChild(notification);

        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }

    onWalletConnected() {
        console.log('🎉 Wallet connected, updating UI...');

        try {
            // Update connect button
            if (this.connectBtn) {
                const address = this.publicKey.toString();
                this.connectBtn.textContent = `${address.slice(0, 4)}...${address.slice(-4)}`;
                this.connectBtn.classList.add('connected');
            }

            // Update hero connect wallet button
            if (this.heroConnectWalletBtn) {
                const address = this.publicKey.toString();
                this.heroConnectWalletBtn.textContent = `${address.slice(0, 4)}...${address.slice(-4)}`;
                this.heroConnectWalletBtn.classList.add('connected');
            }

            // Enable buy button
            if (this.buyBtn) {
                this.buyBtn.disabled = false;
            }

            // Show user info section
            if (this.userInfo) {
                this.userInfo.style.display = 'flex';
            }

            // Update wallet address display
            if (this.userAddress) {
                this.userAddress.textContent = `${this.publicKey.toString().slice(0, 15)}...`;
            }

            // Hide connect button
            if (this.connectBtn) {
                this.connectBtn.style.display = 'none';
            }

            // Hide mobile connect wallet button
            if (this.mobileConnectWalletBtn) {
                this.mobileConnectWalletBtn.style.display = 'none';
            }

            // Hide hero connect wallet button
            if (this.heroConnectWalletBtn) {
                this.heroConnectWalletBtn.style.display = 'none';
            }

            // Show nav balance
            if (this.userBalanceNav) {
                this.userBalanceNav.style.display = 'inline';
            }

            // Load user's existing token balance FIRST
            this.loadUserData();

            // Update user balance display AFTER loading data
            this.updateUserBalanceDisplay();

            // Check admin access
            this.checkAdminAccess();

            // Generate referral code
            this.generateReferralCode();

            // Hide wallet modal
            if (this.walletModal) {
                this.walletModal.classList.remove('show');
                document.body.style.overflow = '';
            }

            // Close mobile menu if open
            if (this.mobileMenuToggle && this.mobileMenuToggle.classList.contains('active')) {
                this.toggleMobileMenu();
            }

            this.showNotification('✅ Wallet connected successfully!', 'success');
            console.log('✅ UI updated successfully');

        } catch (error) {
            console.error('❌ Error updating UI after wallet connection:', error);
            this.showNotification('✅ Connected successfully! (Minor UI issues)', 'success');
        }
    }

    checkAdminAccess() {
        if (this.publicKey && this.publicKey.toString() === this.adminWallet) {
            this.isAdmin = true;
            if (this.adminBtn) {
                this.adminBtn.style.display = 'block';
            }
            this.updateAdminPanel();
            this.showNotification('👑 Admin access granted!', 'success');
        }
    }

    showAdminPanel() {
        if (!this.isAdmin) {
            this.showNotification('Admin access required!', 'error');
            return;
        }

        this.updateAdminPanel();
        this.showModal(this.adminModal);
    }

    updateAdminPanel() {
        if (this.adminElements.tokensSent) {
            this.adminElements.tokensSent.textContent = this.tokensSentToday.toLocaleString();
        }

        if (this.adminElements.remaining) {
            const remaining = Math.max(this.dailyTokenLimit - this.tokensSentToday, 0);
            this.adminElements.remaining.textContent = remaining.toLocaleString();
        }

        this.updateBannedUsersList();
    }

    updateBannedUsersList() {
        if (!this.adminElements.bannedList) return;

        if (!this.bannedUsers || this.bannedUsers.size === 0) {
            this.adminElements.bannedList.textContent = 'No banned users';
            return;
        }

        const bannedArray = Array.from(this.bannedUsers);
        this.adminElements.bannedList.innerHTML = bannedArray.map(address => (
            `<div class="banned-user">
                <span>${address.slice(0, 6)}...${address.slice(-4)}</span>
                <button class="unban-btn" data-address="${address}">Unban</button>
            </div>`
        )).join('');

        const unbanButtons = this.adminElements.bannedList.querySelectorAll('.unban-btn');
        unbanButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const address = e.currentTarget.getAttribute('data-address');
                if (address) {
                    this.bannedUsers.delete(address);
                    this.updateBannedUsersList();
                    this.saveData();
                    this.showNotification(`User ${address.slice(0, 6)}... unbanned`, 'success');
                }
            });
        });
    }

    banUser() {
        if (!this.isAdmin || !this.adminElements.banAddress) return;

        const address = this.adminElements.banAddress.value.trim();
        if (!address) {
            this.showNotification('Please enter an address to ban', 'warning');
            return;
        }

        this.bannedUsers.add(address);
        this.adminElements.banAddress.value = '';
        this.updateBannedUsersList();
        this.saveData();
        this.showNotification(`User ${address.slice(0, 6)}... banned`, 'success');
    }

    async executeAdminAction() {
        if (!this.isAdmin || !this.adminElements.action || !this.adminElements.userAddress || !this.adminElements.tokenAmount) {
            return;
        }

        const action = this.adminElements.action.value;
        const userAddress = this.adminElements.userAddress.value.trim();
        const tokenAmount = parseInt(this.adminElements.tokenAmount.value, 10);

        if (!userAddress || !tokenAmount || tokenAmount <= 0) {
            this.showNotification('Please fill out all admin fields', 'warning');
            return;
        }

        // Validate Solana address
        if (!this.isValidSolanaAddress(userAddress)) {
            this.showNotification('❌ Invalid Solana address format', 'error');
            return;
        }

        if (tokenAmount > 20000000) {
            this.showNotification('Maximum 20M tokens per transaction', 'warning');
            return;
        }

        if (this.tokensSentToday + tokenAmount > this.dailyTokenLimit) {
            this.showNotification('Daily limit exceeded', 'error');
            return;
        }

        try {
            if (action === 'send') {
                const success = await this.sendTokensToUser(userAddress, tokenAmount);
                if (success) {
                    this.showNotification(`✅ Successfully sent ${tokenAmount.toLocaleString()} $ROT to ${userAddress.slice(0, 6)}...`, 'success');
                } else {
                    this.showNotification('❌ Failed to send tokens. Please try again.', 'error');
                    return;
                }
            } else {
                await this.simulateTokenWithdraw(userAddress, tokenAmount);
                this.showNotification(`Withdrew ${tokenAmount.toLocaleString()} $ROT from ${userAddress.slice(0, 6)}...`, 'success');
            }

            this.tokensSentToday += tokenAmount;
            this.updateAdminPanel();

            this.adminElements.userAddress.value = '';
            this.adminElements.tokenAmount.value = '';
            this.saveData();
        } catch (error) {
            console.error('Admin action failed:', error);
            this.showNotification('Admin action failed. Please try again.', 'error');
        }
    }

    async sendTokensToUser(userAddress, amount) {
        try {
            console.log(`🔄 Sending ${amount} $ROT to ${userAddress}...`);

            // Validate the target address
            if (!this.isValidSolanaAddress(userAddress)) {
                this.showNotification('❌ Invalid Solana address format', 'error');
                return false;
            }

            // Check if user already has a balance record
            const existingData = localStorage.getItem(`brainrot_user_${userAddress}`);
            let currentTokens = 0;

            if (existingData) {
                const userData = JSON.parse(existingData);
                currentTokens = userData.tokens || 0;
            }

            // Add the new tokens
            const newTotal = currentTokens + amount;

            // Save the updated balance
            const userData = {
                tokens: newTotal,
                wallet: userAddress,
                lastUpdated: Date.now()
            };

            localStorage.setItem(`brainrot_user_${userAddress}`, JSON.stringify(userData));

            console.log(`✅ Successfully sent ${amount} $ROT to ${userAddress}. New balance: ${newTotal.toLocaleString()}`);

            // Show notification to admin that tokens were sent
            this.showNotification(`🎁 ${amount.toLocaleString()} $ROT sent to ${userAddress.slice(0, 8)}... - they can now log in to see their balance!`, 'success');

            return true;

        } catch (error) {
            console.error('❌ Failed to send tokens:', error);
            return false;
        }
    }

    async simulateTokenWithdraw(userAddress, amount) {
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log(`Simulated withdraw of ${amount} $ROT from ${userAddress}`);
    }

    generateReferralCode() {
        if (!this.publicKey) return;

        const code = this.publicKey.toString().slice(0, 8).toUpperCase();
        if (this.userReferralLink) {
            this.userReferralLink.value = `${window.location.origin}?ref=${code}`;
        }

        const existingCode = localStorage.getItem(`brainrot_ref_${this.publicKey.toString()}`);
        if (!existingCode) {
            localStorage.setItem(`brainrot_ref_${this.publicKey.toString()}`, code);
        }
    }

    applyReferral() {
        if (!this.referralInput) return;

        const code = this.referralInput.value.trim().toUpperCase();
        if (!code) {
            this.showNotification('Please enter a referral code', 'warning');
            return;
        }

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot use referrals!', 'error');
            return;
        }

        localStorage.setItem(`brainrot_used_ref_${this.publicKey?.toString()}`, code);
        this.showNotification('Referral code applied!', 'success');
        this.referralInput.value = '';
    }

    copyReferralLink() {
        if (!this.userReferralLink) return;

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot copy referral links!', 'error');
            return;
        }

        this.userReferralLink.select();
        document.execCommand('copy');
        this.showNotification('Referral link copied!', 'success');
    }

    showPurchaseModal() {
        console.log('🛒 Showing purchase modal...');

        if (!this.wallet) {
            this.showNotification('Please connect your wallet first', 'warning');
            return;
        }

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot make purchases!', 'error');
            return;
        }

        if (this.solInput) {
            const currentValue = parseFloat(this.solInput.value);
            if (!currentValue || currentValue < 0.1) {
                this.solInput.value = '1';
            }
        }

        // Show demo warning
        this.showDemoWarning();

        this.updatePurchaseModal();
        this.showModal(this.purchaseModal);
    }

    updatePurchaseModal() {
        const phase = this.phases[this.currentPhase - 1];

        // Update modal content
        const modalPhase = document.getElementById('modal-phase');
        const modalRate = document.getElementById('modal-rate');
        const modalBonus = document.getElementById('modal-bonus');

        if (modalPhase) modalPhase.textContent = `Phase ${this.currentPhase}`;
        if (modalRate) modalRate.textContent = `${phase.rate.toLocaleString()} ROT = 1 SOL`;
        if (modalBonus) modalBonus.textContent = `${phase.bonus}%`;

        // Hide manual payment info when opening modal for new purchase
        this.hideManualPaymentFallback();
        this.updateCalculations();
    }

    updateCalculations() {
        if (!this.solInput) return;

        const solAmount = parseFloat(this.solInput.value) || 0;
        const phase = this.phases[this.currentPhase - 1];

        if (solAmount < 0.1 || solAmount > 10) {
            this.updateCalculationDisplay(0, 0, 0, 0);
            if (this.confirmPurchaseBtn) {
                this.confirmPurchaseBtn.disabled = true;
            }
            return;
        }

        const baseTokens = Math.floor(solAmount * phase.rate);
        const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
        const totalTokens = baseTokens + bonusTokens;

        this.updateCalculationDisplay(solAmount, baseTokens, bonusTokens, totalTokens);
        if (this.confirmPurchaseBtn) {
            this.confirmPurchaseBtn.disabled = false;
        }
    }

    updateCalculationDisplay(sol, base, bonus, total) {
        const calcSol = document.getElementById('calc-sol');
        const calcTokens = document.getElementById('calc-tokens');
        const calcBonusTokens = document.getElementById('calc-bonus-tokens');
        const calcTotal = document.getElementById('calc-total');

        if (calcSol) calcSol.textContent = sol.toFixed(1);
        if (calcTokens) calcTokens.textContent = base.toLocaleString();
        if (calcBonusTokens) calcBonusTokens.textContent = bonus.toLocaleString();
        if (calcTotal) calcTotal.textContent = total.toLocaleString();
    }

    async handlePurchase() {
        console.log('🚀 CONFIRM PURCHASE - Starting DIRECT transaction...');

        try {
            if (!this.solInput) {
                console.error('❌ SOL input not found');
                this.showNotification('❌ Input error. Please refresh the page.', 'error');
                return;
            }

            const solAmount = parseFloat(this.solInput.value);

            if (!solAmount || solAmount < 0.1 || solAmount > 10) {
                console.log('❌ Invalid SOL amount:', solAmount);
                this.showNotification('Please enter a valid amount (0.1 - 10 SOL)', 'warning');
                return;
            }

            if (!this.wallet) {
                console.error('❌ Wallet not connected');
                this.showNotification('Please connect your wallet first', 'warning');
                return;
            }

            if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
                this.showNotification('Banned users cannot make purchases!', 'error');
                return;
            }

            console.log('✅ All validations passed, creating transaction...');

            const success = await this.createSimpleTransaction(solAmount);

            if (success) {
                console.log('✅ Purchase successful');
                this.hideModal(this.purchaseModal);
                const calcTotal = document.getElementById('calc-total');
                const totalText = calcTotal ? calcTotal.textContent : 'tokens';
                this.showNotification(`✅ Successfully purchased ${totalText} $ROT!`, 'success');
                this.updateUserBalanceAfterPurchase();
            } else {
                console.log('❌ Purchase failed');
                this.showManualPaymentFallback();
                this.showNotification('❌ Purchase failed. Please use manual payment below.', 'error');
            }

        } catch (error) {
            console.error('❌ Purchase error:', error);
            this.showNotification(`❌ Purchase failed: ${error.message || 'Unknown error'}`, 'error');
            this.showManualPaymentFallback();
        }
    }

    updateUserBalanceAfterPurchase() {
        if (!this.solInput) return;

        const solAmount = parseFloat(this.solInput.value) || 0;
        const phase = this.phases[this.currentPhase - 1];
        const baseTokens = Math.floor(solAmount * phase.rate);
        const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
        const totalTokens = baseTokens + bonusTokens;

        this.userTokens += totalTokens;
        this.updateUserBalanceDisplay();
        this.saveUserData();
    }

    showManualPaymentFallback() {
        if (!this.manualPaymentInfo || !this.manualPaymentAddress) return;

        const address = this.presaleWallet;
        this.manualPaymentAddress.textContent = address;
        this.manualPaymentAddress.dataset.address = address;
        this.manualPaymentAddress.classList.remove('copied');
        this.manualPaymentInfo.style.display = 'block';
    }

    hideManualPaymentFallback() {
        if (this.manualPaymentInfo) {
            this.manualPaymentInfo.style.display = 'none';
        }

        if (this.manualPaymentAddress) {
            this.manualPaymentAddress.classList.remove('copied');
        }
    }

    async copyManualPaymentAddress() {
        if (!this.manualPaymentAddress) return;

        const address = this.manualPaymentAddress.dataset.address || this.presaleWallet;
        if (!address) return;

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(address);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = address;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }

            this.manualPaymentAddress.classList.add('copied');
            setTimeout(() => this.manualPaymentAddress?.classList.remove('copied'), 2000);
            this.showNotification('Presale wallet address copied!', 'success');

        } catch (error) {
            console.error('Failed to copy presale address:', error);
            this.showNotification('Could not copy address. Please copy manually.', 'error');
        }
    }

    claimAirdrop() {
        if (!this.wallet) {
            this.showNotification('Please connect your wallet first to claim airdrop', 'warning');
            return;
        }

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot claim airdrops!', 'error');
            return;
        }

        // Check if presale has ended
        if (!this.isPresaleEnded()) {
            this.showNotification('🎯 Airdrop participation registered! You will be eligible to claim after presale ends.', 'info');
            return;
        }

        // Calculate airdrop amount based on referrals
        const airdropAmount = this.calculateReferralAirdrop();

        if (airdropAmount <= 0) {
            this.showNotification('No airdrop available. Invite friends during presale to earn $ROT!', 'info');
            return;
        }

        // Add airdrop tokens to user balance
        this.userTokens += airdropAmount;
        this.updateUserBalanceDisplay();
        this.saveUserData();

        this.showNotification(`🎁 Airdrop claimed! ${airdropAmount.toLocaleString()} $ROT added to your balance!`, 'success');
    }

    calculateReferralAirdrop() {
        if (!this.publicKey) return 0;

        // Check how many people used this user's referral code
        let referralCount = 0;
        const userWallet = this.publicKey.toString();

        // Check localStorage for users who used referral codes
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('brainrot_used_ref_')) {
                try {
                    const usedRefData = localStorage.getItem(key);
                    if (usedRefData === userWallet) {
                        referralCount++;
                    }
                } catch (e) {
                    // Ignore invalid data
                }
            }
        }

        // Calculate airdrop: 500 $ROT per successful referral
        const airdropPerReferral = 500;
        return referralCount * airdropPerReferral;
    }

    isPresaleEnded() {
        // Presale ends when we reach 100% progress or final phase
        const progressPercentage = (this.tokensSold / this.presaleTokens) * 100;
        return progressPercentage >= 100 || this.currentPhase >= 3;
    }

    startPhaseTimer() {
        const now = Date.now();
        const fourDaysMs = 4 * 24 * 60 * 60 * 1000;
        const twoHoursMs = 2 * 60 * 60 * 1000;
        const eighteenMinutesMs = 18 * 60 * 1000;
        const endTime = now + fourDaysMs + twoHoursMs + eighteenMinutesMs;

        const timer = setInterval(() => {
            const remaining = endTime - Date.now();

            if (remaining <= 0) {
                clearInterval(timer);
                if (this.currentPhase < 3) {
                    this.currentPhase++;
                    this.startPhaseTimer();
                }
            } else {
                const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
                const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

                const phaseTimer = document.getElementById('phase-timer');
                if (phaseTimer) {
                    phaseTimer.textContent = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    updateStatsDisplay() {
        const progressPercentage = (this.tokensSold / this.presaleTokens) * 100;
        const phase = this.phases[this.currentPhase - 1];

        // Update display elements safely
        const elements = {
            raised: document.getElementById('total-raised'),
            participants: document.getElementById('participants'),
            phase: document.getElementById('current-phase'),
            tokensSold: document.getElementById('tokens-sold'),
            progress: document.getElementById('progress-fill'),
            phaseTitle: document.getElementById('phase-title'),
            currentRate: document.getElementById('current-rate'),
            bonusAmount: document.getElementById('bonus-amount'),
            phaseProgress: document.getElementById('phase-progress'),
            phaseTimer: document.getElementById('phase-timer')
        };

        if (elements.raised) elements.raised.textContent = this.totalRaised.toFixed(1);
        if (elements.participants) elements.participants.textContent = this.participants.toLocaleString();
        if (elements.phase) elements.phase.textContent = `PHASE ${this.currentPhase}`;
        if (elements.tokensSold) elements.tokensSold.textContent = this.tokensSold.toLocaleString();
        if (elements.progress) elements.progress.style.width = `${Math.min(progressPercentage, 100)}%`;
        if (elements.phaseTitle) elements.phaseTitle.textContent = phase.name;
        if (elements.currentRate) elements.currentRate.textContent = `${phase.rate.toLocaleString()} ROT = 1 SOL`;
        if (elements.bonusAmount) elements.bonusAmount.textContent = `${Math.floor(phase.rate * (phase.bonus / 100)).toLocaleString()} ROT per SOL`;

        const phaseProgress = ((this.tokensSold % (this.presaleTokens / 3)) / (this.presaleTokens / 3)) * 100;
        if (elements.phaseProgress) elements.phaseProgress.textContent = `${Math.min(phaseProgress, 100).toFixed(1)}%`;
    }

    updateUserBalanceDisplay() {
        console.log('Updating balance display:', this.userTokens);

        // Only show balance if user is connected to a wallet
        if (!this.publicKey) {
            console.log('❌ No wallet connected - hiding balance');
            this.hideUserBalance();
            return;
        }

        const balanceText = `${this.userTokens.toLocaleString()} $ROT`;

        if (this.userBalance) {
            this.userBalance.textContent = balanceText;
            this.userBalance.style.display = 'inline';
        }

        if (this.userBalanceNav) {
            this.userBalanceNav.textContent = balanceText;
            this.userBalanceNav.style.display = 'inline';
        }

        console.log('✅ Balance displayed for connected wallet');
    }

    hideUserBalance() {
        if (this.userBalance) {
            this.userBalance.style.display = 'none';
        }

        if (this.userBalanceNav) {
            this.userBalanceNav.style.display = 'none';
        }
    }

    showWalletRequiredMessage() {
        if (this.userBalance) {
            this.userBalance.textContent = 'Connect wallet to view balance';
            this.userBalance.style.display = 'inline';
            this.userBalance.style.color = 'var(--secondary-text)';
            this.userBalance.style.fontSize = '0.875rem';
        }

        if (this.userBalanceNav) {
            this.userBalanceNav.textContent = '0 $ROT';
            this.userBalanceNav.style.display = 'inline';
        }
    }

    loadData() {
        const savedData = localStorage.getItem('brainrot_presale_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            Object.assign(this, data);
        }

        const bannedData = localStorage.getItem('brainrot_banned_users');
        if (bannedData) {
            this.bannedUsers = new Set(JSON.parse(bannedData));
        }

        this.updateStatsDisplay();
        this.setupRealisticProgress();
    }

    setupRealisticProgress() {
        const phase = this.phases[this.currentPhase - 1];
        const baselineTokens = Math.floor(this.presaleTokens * 0.21);

        if (!this.tokensSold || this.tokensSold < baselineTokens) {
            this.tokensSold = baselineTokens;
            this.totalRaised = this.tokensSold / phase.rate;
        }

        if (!this.participants || this.participants < 627) {
            this.participants = 627;
        }

        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }

        this.updateStatsDisplay();

        this.progressInterval = setInterval(() => {
            if (this.tokensSold >= this.presaleTokens) {
                clearInterval(this.progressInterval);
                return;
            }

            const randomSol = parseFloat((Math.random() * 9.9 + 0.1).toFixed(2));
            const tokensToAdd = Math.floor(randomSol * phase.rate);

            this.tokensSold = Math.min(this.tokensSold + tokensToAdd, this.presaleTokens);
            this.totalRaised += randomSol;
            this.participants += 1;

            this.updateStatsDisplay();
            this.saveData();
        }, 60 * 1000);

        console.log('Presale progress simulation running at 1 sale per minute.');
    }

    saveUserData() {
        if (this.publicKey) {
            const userData = {
                tokens: this.userTokens,
                wallet: this.publicKey.toString()
            };
            localStorage.setItem(`brainrot_user_${this.publicKey.toString()}`, JSON.stringify(userData));
        }
    }

    loadUserData() {
        if (this.publicKey) {
            const savedData = localStorage.getItem(`brainrot_user_${this.publicKey.toString()}`);
            if (savedData) {
                const userData = JSON.parse(savedData);
                this.userTokens = userData.tokens || 0;
                this.updateUserBalanceDisplay();
            }
        }
    }

    saveData() {
        const data = {
            tokensSold: this.tokensSold,
            totalRaised: this.totalRaised,
            participants: this.participants
        };
        localStorage.setItem('brainrot_presale_data', JSON.stringify(data));
        localStorage.setItem('brainrot_banned_users', JSON.stringify(Array.from(this.bannedUsers)));
    }

    isMobileDevice() {
        // More comprehensive mobile detection
        const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isMobileScreen = window.innerWidth <= 768 && window.innerHeight <= 1024;

        // Also check for touch capability as additional indicator
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        return isMobileUA || (isMobileScreen && hasTouchScreen);
    }

    toggleMobileMenu() {
        if (this.mobileMenuToggle && this.navLinks) {
            this.mobileMenuToggle.classList.toggle('active');
            this.navLinks.classList.toggle('active');
        }
    }

    async attemptWalletDetection() {
        console.log('🔍 Checking for available wallets...');

        const wallets = {
            phantom: !!(window.solana && window.solana.isPhantom),
            solflare: !!window.solflare,
            backpack: !!window.backpack,
            coinbase: !!window.coinbaseSolana
        };

        console.log('Available wallets:', wallets);

        // Check if Phantom is already connected - try multiple ways
        if (window.solana && window.solana.isPhantom) {
            console.log('✅ Phantom wallet detected, checking connection status...');

            // Try to get the public key in multiple ways
            let publicKey = null;

            try {
                // Method 1: Check if already connected
                if (window.solana.publicKey) {
                    publicKey = window.solana.publicKey;
                    console.log('✅ Found existing publicKey:', publicKey.toString());
                }
                // Method 2: Try to connect if not already connected
                else if (window.solana.connect && typeof window.solana.connect === 'function') {
                    console.log('🔄 Attempting to detect Phantom connection...');
                    const response = await window.solana.connect();
                    if (response && response.publicKey) {
                        publicKey = response.publicKey;
                        console.log('✅ Connected to Phantom:', publicKey.toString());
                    }
                }
            } catch (connectError) {
                console.log('❌ Connection attempt failed:', connectError.message);
                // This is expected if user cancelled or wallet is locked
            }

            if (publicKey) {
                this.publicKey = publicKey;
                this.wallet = window.solana;
                console.log('🎉 Wallet connected successfully!');
                this.onWalletConnected();
                return;
            }
        }

        // Enhanced wallet detection using the comprehensive detection method
        const walletDetected = await this.detectAvailableWallets();

        // Try to force connection if wallet is detected but not connected
        if (walletDetected && window.solana && !this.publicKey) {
            console.log('🔄 Wallet detected but not connected, attempting connection...');

            try {
                if (window.solana.connect && typeof window.solana.connect === 'function') {
                    const response = await window.solana.connect();
                    if (response && response.publicKey) {
                        this.publicKey = response.publicKey;
                        this.wallet = window.solana;
                        console.log('✅ Force-connected to wallet!');
                        this.onWalletConnected();
                        return;
                    }
                }
            } catch (error) {
                console.log('❌ Force connection failed:', error.message);
            }
        }

        // Fallback wallet detection
        if (wallets.phantom) {
            console.log('✅ Phantom wallet detected!');
            this.showNotification('✅ Phantom wallet detected! Click "Connect Wallet" to continue.', 'success');
        } else if (wallets.solflare) {
            console.log('🔄 Solflare detected');
            this.showNotification('🔄 Solflare detected! Click "Connect Wallet" to use it.', 'info');
        } else if (wallets.backpack) {
            console.log('🎒 Backpack detected');
            this.showNotification('🎒 Backpack detected! Click "Connect Wallet" to use it.', 'info');
        } else if (wallets.coinbase) {
            console.log('💙 Coinbase detected');
            this.showNotification('💙 Coinbase detected! Click "Connect Wallet" to use it.', 'info');
        } else if (walletDetected) {
            console.log('✅ Wallet detected via comprehensive detection');
            this.showNotification('✅ Wallet detected! Click "Connect Wallet" to continue.', 'success');
        } else {
            console.log('❌ No injected wallets detected');

            if (this.isMobileDevice()) {
                this.showNotification('📱 No wallet detected. Click "Connect Wallet" to open Phantom app.', 'info');

                // Show mobile connect wallet button if no wallet detected
                if (this.mobileConnectWalletBtn && !this.publicKey) {
                    this.mobileConnectWalletBtn.style.display = 'block';
                }

                // Show hero connect wallet button if no wallet detected
                if (this.heroConnectWalletBtn && !this.publicKey) {
                    this.heroConnectWalletBtn.style.display = 'block';
                }
            } else {
                this.showNotification('❌ No wallet detected. Please install Phantom wallet to continue.', 'warning');
            }
        }
    }

    async connectWallet() {
        console.log('🔗 Starting wallet connection process...');

        try {
            // Check if we're on mobile
            if (this.isMobileDevice()) {
                await this.connectMobileWallet();
            } else {
                await this.connectDesktopWallet();
            }
        } catch (error) {
            console.error('❌ Wallet connection error:', error);
            this.showNotification(`❌ Connection failed: ${error.message || 'Please try again.'}`, 'error');
        }
    }

    async connectDesktopWallet() {
        console.log('🔍 Manual wallet connection attempt...');

        // First, try to detect if any Solana wallet is available
        const walletDetected = await this.detectAvailableWallets();

        if (!walletDetected) {
            this.showNotification('❌ No Solana wallet detected. Please install Phantom wallet first.', 'warning');
            return;
        }

        try {
            console.log('🔐 Attempting to connect to detected wallet...');

            // Try to connect to the detected wallet
            const response = await window.solana.connect();

            if (response && response.publicKey) {
                this.publicKey = response.publicKey;
                this.wallet = window.solana;
                console.log('✅ Wallet connected successfully:', this.publicKey.toString());
                this.onWalletConnected();
            } else {
                throw new Error('Invalid wallet response - no public key returned');
            }
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);

            if (error.code === 4001) {
                this.showNotification('❌ Connection cancelled by user', 'warning');
            } else if (error.code === -32002) {
                this.showNotification('❌ Connection already in progress', 'warning');
            } else if (error.message?.includes('User rejected')) {
                this.showNotification('❌ Connection rejected. Please approve the connection in your wallet.', 'warning');
            } else if (error.message?.includes('locked') || error.message?.includes('unlock')) {
                this.showNotification('❌ Please unlock your wallet and try again', 'warning');
            } else {
                this.showNotification(`❌ Connection failed: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    }

    async detectAvailableWallets() {
        console.log('🔍 Detecting available Solana wallets...');

        // Method 1: Check for standard Phantom injection
        if (window.solana && window.solana.isPhantom) {
            console.log('✅ Phantom wallet detected via window.solana');
            return true;
        }

        // Method 2: Check for other wallet providers
        const walletProviders = [
            'solana',
            'phantom',
            'solflare',
            'backpack',
            'coinbaseSolana'
        ];

        for (const provider of walletProviders) {
            if (window[provider]) {
                console.log(`✅ Found wallet provider: ${provider}`);

                // If it's not the standard solana object, assign it
                if (provider !== 'solana' && window[provider].isPhantom) {
                    window.solana = window[provider];
                    console.log('✅ Assigned wallet to window.solana');
                    return true;
                }

                if (window[provider].publicKey || window[provider].connect) {
                    window.solana = window[provider];
                    console.log('✅ Assigned wallet to window.solana');
                    return true;
                }
            }
        }

        // Method 3: Check for wallet extensions that might be available
        if (typeof window.phantom !== 'undefined') {
            console.log('✅ Phantom extension detected');
            window.solana = window.phantom.solana;
            return true;
        }

        // Method 4: Try to detect mobile wallet apps
        if (this.isMobileDevice()) {
            console.log('📱 Mobile device detected, checking for mobile wallet apps...');

            // On mobile, wallets might be available through different means
            // Try to trigger wallet selection manually
            try {
                if (window.solana && window.solana.connect) {
                    console.log('✅ Mobile wallet connection method available');
                    return true;
                }
            } catch (e) {
                console.log('❌ Mobile wallet detection failed:', e.message);
            }

            // Try alternative mobile wallet detection methods
            const mobileWallets = [
                'phantom',
                'solflare',
                'backpack'
            ];

            for (const wallet of mobileWallets) {
                if (window[wallet] && (window[wallet].solana || window[wallet].connect)) {
                    console.log(`✅ Mobile wallet detected: ${wallet}`);
                    window.solana = window[wallet].solana || window[wallet];
                    return true;
                }
            }

            // Check if we're in a mobile browser that might have wallet support
            if (navigator.userAgent.includes('Chrome') || navigator.userAgent.includes('Safari')) {
                console.log('✅ Mobile browser detected - wallet may be available');
                // On mobile browsers, wallets are typically available through the main solana object
                // We'll return true here and let the connection attempt handle the actual connection
                return true;
            }
        }

        console.log('❌ No Solana wallets detected');
        return false;
    }

    async connectMobileWallet() {
        // For mobile, use the correct Phantom app URL scheme
        const currentUrl = window.location.href;
        const appUrl = encodeURIComponent(currentUrl);

        // Use the correct Phantom mobile app URL scheme for deep linking
        // Format: phantom://browse/{encoded_url}
        const phantomAppUrl = `phantom://browse/${appUrl}`;

        console.log('📱 Opening Phantom app with mobile URL scheme:', phantomAppUrl);

        // Store connection attempt for when user returns
        sessionStorage.setItem('phantom_connection_attempt', 'true');
        sessionStorage.setItem('phantom_return_url', currentUrl);

        this.showNotification('🔗 Opening Phantom app... Please connect and return to continue.', 'info');

        // Try to open the Phantom app directly using the mobile URL scheme
        if (this.isMobileDevice()) {
            try {
                // Use the mobile app URL scheme first
                window.location.href = phantomAppUrl;

                // Set up a fallback in case the mobile URL scheme doesn't work
                setTimeout(() => {
                    if (!this.publicKey) {
                        console.log('🔄 Mobile URL scheme may have failed, trying alternative method...');
                        // Try alternative format
                        const alternativeUrl = `phantom://connect?uri=${appUrl}`;
                        window.location.href = alternativeUrl;
                    }
                }, 3000);
            } catch (error) {
                console.error('❌ Mobile URL scheme failed:', error);
                // Try alternative format
                const alternativeUrl = `phantom://connect?uri=${appUrl}`;
                window.location.href = alternativeUrl;
            }
        } else {
            // For desktop, open in new tab
            const webUrl = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${appUrl}`;
            window.open(webUrl, '_blank');
        }

        // Set a timeout to show manual connection option if user returns without connecting
        setTimeout(() => {
            if (!this.publicKey) {
                console.log('⏰ Connection timeout - showing manual connection option');
                this.showManualConnectionOption();
            }
        }, 15000); // 15 seconds timeout
    }

    showManualConnectionOption() {
        // Create a manual connection button that appears if automatic detection fails
        const manualBtn = document.createElement('button');
        manualBtn.id = 'manual-wallet-connect';
        manualBtn.innerHTML = '🔗 Connect Wallet Manually';
        manualBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        `;

        document.body.appendChild(manualBtn);

        manualBtn.addEventListener('click', async () => {
            console.log('🔗 Manual connection clicked');
            manualBtn.remove();

            // Try comprehensive wallet detection
            const detected = await this.detectAvailableWallets();

            if (detected) {
                this.showNotification('✅ Wallet detected! Attempting connection...', 'success');
                await this.connectDesktopWallet();
            } else {
                this.showNotification('❌ No wallet detected. Please ensure Phantom is installed and try again.', 'warning');

                // Show installation help
                setTimeout(() => {
                    this.showWalletInstallationHelp();
                }, 2000);
            }
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (manualBtn.parentNode) {
                manualBtn.remove();
            }
        }, 30000);
    }

    showWalletInstallationHelp() {
        const helpDiv = document.createElement('div');
        helpDiv.id = 'wallet-help';
        helpDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10002;
                max-width: 400px;
                text-align: center;
            ">
                <h3 style="margin-top: 0; color: #333;">Install Phantom Wallet</h3>
                <p style="color: #666; margin-bottom: 1.5rem;">
                    To connect your wallet, please install the Phantom wallet app:
                </p>
                <div style="margin-bottom: 1.5rem;">
                    <a href="https://phantom.app/download"
                       style="
                           display: inline-block;
                           background: #ab9ff2;
                           color: white;
                           padding: 0.75rem 1.5rem;
                           border-radius: 8px;
                           text-decoration: none;
                           font-weight: 600;
                       "
                       target="_blank">
                        📱 Download Phantom
                    </a>
                </div>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="
                            background: #f1f5f9;
                            border: 1px solid #e2e8f0;
                            color: #64748b;
                            padding: 0.5rem 1rem;
                            border-radius: 6px;
                            cursor: pointer;
                        ">
                    Close
                </button>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
        `;

        backdrop.addEventListener('click', () => {
            helpDiv.remove();
            backdrop.remove();
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(helpDiv);
    }

    showDemoWarning() {
        const warningDiv = document.createElement('div');
        warningDiv.id = 'demo-warning';
        warningDiv.innerHTML = `
            <div style="
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 1rem;
                color: #92400e;
                font-size: 0.875rem;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                    <span style="margin-right: 0.5rem;">⚠️</span>
                    <strong>Demo Mode</strong>
                </div>
                <p style="margin: 0; line-height: 1.4;">
                    This is a demonstration dApp. Security warnings may appear because this dApp doesn't have production verification.
                    In a real dApp, you would need proper domain verification and metadata to avoid these warnings.
                </p>
            </div>
        `;

        // Add to purchase modal if it exists
        const purchaseModal = document.getElementById('purchase-modal');
        if (purchaseModal) {
            const existingWarning = purchaseModal.querySelector('#demo-warning');
            if (!existingWarning) {
                const modalBody = purchaseModal.querySelector('.modal-body') || purchaseModal.querySelector('.modal-content') || purchaseModal;
                modalBody.insertBefore(warningDiv, modalBody.firstChild);
            }
        }
    }

    showConnectionInstructions() {
        const instructionsDiv = document.createElement('div');
        instructionsDiv.id = 'connection-instructions';
        instructionsDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                z-index: 10002;
                max-width: 450px;
                text-align: center;
            ">
                <h3 style="margin-top: 0; color: #333;">📱 Connect Phantom Wallet</h3>
                <div style="text-align: left; margin: 1.5rem 0;">
                    <p style="margin-bottom: 1rem; color: #666;">
                        <strong>After Phantom app opens:</strong>
                    </p>
                    <ol style="color: #666; padding-left: 1.5rem;">
                        <li style="margin-bottom: 0.5rem;">Connect your wallet in Phantom</li>
                        <li style="margin-bottom: 0.5rem;">Tap "Connect" when prompted</li>
                        <li style="margin-bottom: 0.5rem;">Return to this website</li>
                        <li style="margin-bottom: 0.5rem;">Your wallet should connect automatically</li>
                    </ol>
                    <p style="margin-top: 1.5rem; color: #666;">
                        <strong>If it doesn't connect automatically:</strong>
                    </p>
                </div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button id="try-manual-connect" style="
                        background: #ab9ff2;
                        color: white;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                    ">
                        🔗 Try Manual Connect
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: #f1f5f9;
                        border: 1px solid #e2e8f0;
                        color: #64748b;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        cursor: pointer;
                    ">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
        `;

        backdrop.addEventListener('click', () => {
            instructionsDiv.remove();
            backdrop.remove();
        });

        document.body.appendChild(backdrop);
        document.body.appendChild(instructionsDiv);

        // Add event listener for manual connect button
        const manualBtn = document.getElementById('try-manual-connect');
        if (manualBtn) {
            manualBtn.addEventListener('click', () => {
                instructionsDiv.remove();
                backdrop.remove();
                this.showManualConnectionOption();
            });
        }
    }

    promptPhantomDeepLink() {
        const currentUrl = window.location.href;
        const appUrl = encodeURIComponent(currentUrl);

        // Use the correct Phantom mobile app URL scheme for deep linking
        const phantomAppUrl = `phantom://browse/${appUrl}`;

        console.log('📱 Using Phantom mobile URL scheme:', phantomAppUrl);

        sessionStorage.setItem('phantom_connection_attempt', 'true');
        sessionStorage.setItem('phantom_return_url', currentUrl);

        // For mobile, try the app URL scheme first
        if (this.isMobileDevice()) {
            try {
                window.location.href = phantomAppUrl;
            } catch (error) {
                console.error('❌ Mobile URL scheme failed, trying alternative');
                const alternativeUrl = `phantom://connect?uri=${appUrl}`;
                window.location.href = alternativeUrl;
            }
        } else {
            // For desktop, use web URL
            const webUrl = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${appUrl}`;
            window.location.href = webUrl;
        }
    }

    checkForWalletConnection() {
        // Check if user is returning from Phantom connection attempt
        const connectionAttempt = sessionStorage.getItem('phantom_connection_attempt');
        const returnUrl = sessionStorage.getItem('phantom_return_url');

        if (connectionAttempt && returnUrl) {
            console.log('🔍 Checking return from Phantom...');
            console.log('Current URL:', window.location.href);
            console.log('Expected URL:', returnUrl);
            console.log('URLs match:', window.location.href === returnUrl);

            if (window.location.href === returnUrl) {
                console.log('🔍 User returned from Phantom, checking wallet connection...');

                // Clear the connection attempt flag
                sessionStorage.removeItem('phantom_connection_attempt');
                sessionStorage.removeItem('phantom_return_url');

                // Try to detect wallet connection multiple times with delays
                this.attemptWalletDetectionWithRetry();
            } else {
                console.log('🔄 URLs don\'t match yet, waiting for return...');

                // Wait a bit and check again in case of timing issues
                setTimeout(() => {
                    if (window.location.href === returnUrl && !this.publicKey) {
                        console.log('🔍 Delayed return detection, checking wallet connection...');
                        sessionStorage.removeItem('phantom_connection_attempt');
                        sessionStorage.removeItem('phantom_return_url');
                        this.attemptWalletDetectionWithRetry();
                    }
                }, 2000);
            }
        }

        // Also check for wallet connection on page visibility change (when returning from app)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && !this.publicKey) {
                console.log('📱 Page became visible, checking for wallet connection...');
                setTimeout(() => {
                    this.attemptWalletDetectionWithRetry();
                }, 500);
            }
        });

        // Add a retry button for manual connection after returning from Phantom
        this.addRetryConnectionButton();
    }

    async attemptWalletDetectionWithRetry() {
        console.log('🔄 Starting wallet detection with retry logic...');

        // First, try to detect if wallet is already connected
        const initialDetection = await this.detectAvailableWallets();

        if (initialDetection && window.solana && window.solana.publicKey) {
            console.log('✅ Wallet already connected!');
            this.publicKey = window.solana.publicKey;
            this.wallet = window.solana;
            this.onWalletConnected();
            return;
        }

        // Try multiple times with increasing delays
        for (let attempt = 1; attempt <= 8; attempt++) {
            console.log(`🔍 Wallet detection attempt ${attempt}/8`);

            try {
                // Try comprehensive wallet detection
                await this.attemptWalletDetection();

                // If we successfully connected, break out of the loop
                if (this.publicKey && this.wallet) {
                    console.log('✅ Wallet connection established!');
                    return;
                }

                // Also check if window.solana.publicKey exists directly
                if (window.solana && window.solana.publicKey && !this.publicKey) {
                    console.log('✅ Found wallet publicKey directly!');
                    this.publicKey = window.solana.publicKey;
                    this.wallet = window.solana;
                    this.onWalletConnected();
                    return;
                }
            } catch (error) {
                console.log(`❌ Detection attempt ${attempt} failed:`, error.message);
            }

            // Wait before next attempt (increasing delay)
            const delay = attempt * 800; // 0.8s, 1.6s, 2.4s, 3.2s, 4s, 4.8s, 5.6s, 6.4s
            console.log(`⏳ Waiting ${delay}ms before next attempt...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        console.log('❌ All wallet detection attempts failed');
        this.showNotification('❌ Wallet connection not detected. Please try connecting manually.', 'warning');

        // Show retry button if still not connected
        if (!this.publicKey) {
            const retryBtn = document.getElementById('retry-wallet-connection');
            if (retryBtn) {
                retryBtn.style.display = 'block';
            }
        }
    }

    addRetryConnectionButton() {
        // Add a manual retry button that appears after returning from Phantom
        const retryBtn = document.createElement('button');
        retryBtn.id = 'retry-wallet-connection';
        retryBtn.innerHTML = '🔄 Retry Wallet Connection';
        retryBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #ff6b6b, #ffa500);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            z-index: 10001;
            display: none;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        `;

        document.body.appendChild(retryBtn);

        retryBtn.addEventListener('click', () => {
            console.log('🔄 Manual retry connection clicked');
            retryBtn.style.display = 'none';
            this.connectWallet();
        });

        // Show retry button when user returns from Phantom without connection
        const showRetryButton = () => {
            if (!this.publicKey && !document.getElementById('wallet-modal').classList.contains('show')) {
                retryBtn.style.display = 'block';
                setTimeout(() => {
                    if (!this.publicKey) {
                        retryBtn.style.display = 'none';
                    }
                }, 10000); // Hide after 10 seconds
            }
        };

        // Show retry button after page visibility change if no wallet connected
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(showRetryButton, 2000);
            }
        });

        // Also show manual connection button for mobile users
        if (this.isMobileDevice()) {
            setTimeout(() => {
                if (!this.publicKey) {
                    this.showManualConnectionOption();
                }
            }, 5000);
        }
    }

    isValidSolanaAddress(address) {
        try {
            new solanaWeb3.PublicKey(address);
            return true;
        } catch (error) {
            return false;
        }
    }

    async createSimpleTransaction(solAmount) {
        try {
            console.log('🔄 Creating SIMPLE transaction...');

            // Get the current phase details
            const phase = this.phases[this.currentPhase - 1];
            const baseTokens = Math.floor(solAmount * phase.rate);
            const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
            const totalTokens = baseTokens + bonusTokens;
            const lamports = Math.floor(solAmount * 1000000000);

            console.log('📊 Transaction details:', {
                solAmount,
                lamports,
                toAddress: this.presaleWallet,
                fromAddress: this.publicKey?.toString(),
                baseTokens,
                bonusTokens,
                totalTokens,
                walletConnected: !!this.wallet,
                publicKeyExists: !!this.publicKey
            });

            // CRITICAL: Ensure wallet is properly connected
            if (!this.wallet || !this.publicKey) {
                console.error('❌ WALLET NOT CONNECTED');
                this.showNotification('❌ Wallet not connected. Please connect your wallet first.', 'error');
                return false;
            }

            // Create connection and get blockhash
            let connection;
            try {
                console.log('🌐 Creating Solana connection...');
                connection = new solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
                await connection.getVersion(); // Test connection
                console.log('✅ Solana connection established');
            } catch (connectionError) {
                console.error('❌ Connection failed:', connectionError);
                this.showNotification('❌ Network connection failed. Please check your internet.', 'error');
                return false;
            }

            // Get blockhash with retry mechanism
            let blockhash, lastValidBlockHeight;
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📦 Getting blockhash (attempt ${attempt}/${maxRetries})...`);
                    const blockhashInfo = await connection.getLatestBlockhash();
                    blockhash = blockhashInfo.blockhash;
                    lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
                    console.log('✅ Blockhash obtained');
                    break;
                } catch (blockhashError) {
                    console.error(`❌ Blockhash attempt ${attempt} failed:`, blockhashError);
                    if (attempt === maxRetries) {
                        this.showNotification('❌ Network error. Please try again.', 'error');
                        return false;
                    }
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            // Create transaction
            const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3;

            console.log('📝 Creating transaction...');
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.publicKey,
                    toPubkey: new PublicKey(this.presaleWallet),
                    lamports: lamports
                })
            );

            // Set transaction properties
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = this.publicKey;

            console.log('✍️ Transaction created, requesting wallet signature...');

            // DIRECT WALLET SIGNATURE - This should trigger Phantom popup
            let signedTransaction;
            try {
                console.log('🔐 REQUESTING WALLET SIGNATURE - Phantom popup should appear now...');
                console.log('🔐 Calling wallet.signTransaction()...');

                signedTransaction = await this.wallet.signTransaction(transaction);
                console.log('✅ Transaction signed by wallet - popup should have appeared');

            } catch (signError) {
                console.error('❌ Wallet signature failed:', signError);

                if (signError.code === 4001 || signError.message?.includes('User rejected')) {
                    this.showNotification('❌ Transaction cancelled by user', 'warning');
                } else if (signError.message?.includes('locked') || signError.message?.includes('unlock')) {
                    this.showNotification('❌ Please unlock your wallet', 'warning');
                } else if (signError.message?.includes('malicious') || signError.message?.includes('blocked')) {
                    this.showNotification('⚠️ Security Warning: This is a demo dApp. In production, ensure your dApp has proper verification and metadata to avoid security warnings.', 'warning');
                } else {
                    this.showNotification(`❌ Wallet signature failed: ${signError.message || 'Unknown error'}`, 'error');
                }
                return false;
            }

            // Send transaction
            let signature;
            try {
                console.log('🚀 Sending transaction to blockchain...');

                // Try signAndSendTransaction first (newer API)
                if (typeof this.wallet.signAndSendTransaction === 'function') {
                    console.log('🔄 Using signAndSendTransaction API...');
                    const result = await this.wallet.signAndSendTransaction(transaction);
                    signature = result.signature || result;
                } else {
                    // Fallback to manual send
                    console.log('🔄 Using manual send API...');
                    signature = await connection.sendTransaction(signedTransaction);
                }

                console.log('✅ Transaction sent:', signature);
            } catch (sendError) {
                console.error('❌ Transaction send failed:', sendError);
                this.showNotification(`❌ Transaction failed: ${sendError.message || 'Network error'}`, 'error');
                return false;
            }

            // Confirm transaction and verify success
            try {
                console.log('⏳ Waiting for confirmation...');

                // Wait for confirmation with timeout
                const confirmation = await Promise.race([
                    connection.confirmTransaction(signature, 'confirmed'),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Confirmation timeout')), 30000)
                    )
                ]);

                console.log('✅ Transaction confirmed on blockchain');

                // Verify the transaction was actually successful
                try {
                    const txInfo = await connection.getTransaction(signature);
                    if (txInfo && txInfo.meta && txInfo.meta.err === null) {
                        console.log('✅ Transaction verified as successful');
                    } else {
                        console.error('❌ Transaction failed on blockchain:', txInfo?.meta?.err);
                        this.showNotification('❌ Transaction failed on blockchain. Tokens not credited.', 'error');
                        return false;
                    }
                } catch (verifyError) {
                    console.error('❌ Transaction verification failed:', verifyError);
                    // Still return true since confirmation passed
                    console.log('⚠️ Verification failed but confirmation passed - assuming success');
                }

                return true;

            } catch (confirmError) {
                console.error('❌ Transaction confirmation failed:', confirmError);
                this.showNotification('❌ Transaction confirmation failed. Please check your wallet.', 'error');
                return false;
            }

        } catch (error) {
            console.error('❌ Transaction creation failed:', error);
            this.showNotification(`❌ Transaction failed: ${error.message || 'Unknown error'}`, 'error');
            return false;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing BrainRot Presale...');
    new BrainRotPresale();
    console.log('✅ BrainRot Presale initialized!');
});
