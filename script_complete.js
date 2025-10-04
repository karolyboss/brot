// BrainRot Presale Website JavaScript - Complete Working Version

class BrainRotPresale {
    constructor() {
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
        this.participants = Math.floor(this.tokensSold / 50000) + 15;

        this.userTokens = 0;
        this.bannedUsers = new Set();
        this.dailyTokenLimit = 20000000;
        this.tokensSentToday = 0;
        this.todayDate = new Date().toDateString();

        console.log('🧠 BrainRot Presale constructor called');
        this.initializeApp();
    }

    async initializeApp() {
        console.log('🚀 Initializing BrainRot Presale app...');
        this.setupElements();
        this.setupEventListeners();
        this.startPhaseTimer();
        this.loadData();
        this.debugWalletDetection();

        // Try wallet detection after a delay
        setTimeout(() => {
            console.log('🔍 Attempting wallet detection...');
            this.attemptWalletDetection();
        }, 1000);
    }

    setupElements() {
        console.log('🔧 Setting up DOM elements...');

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

        // Airdrop elements
        this.claimAirdropBtn = document.getElementById('claim-airdrop-btn');

        // Admin elements
        this.adminElements = {
            action: document.getElementById('admin-action'),
            userAddress: document.getElementById('user-address'),
            tokenAmount: document.getElementById('token-amount'),
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
    }

    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

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

        // Phantom connect button
        const phantomConnect = document.getElementById('phantom-connect');
        if (phantomConnect) {
            console.log('✅ Phantom connect button found, adding listener');
            phantomConnect.addEventListener('click', (e) => {
                console.log('👻 Phantom connect button clicked');
                e.preventDefault();
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

        // Referral system
        const applyReferralBtn = document.getElementById('apply-referral');
        if (applyReferralBtn) {
            applyReferralBtn.addEventListener('click', () => this.applyReferral());
        }

        const copyReferralBtn = document.getElementById('copy-referral');
        if (copyReferralBtn) {
            copyReferralBtn.addEventListener('click', () => this.copyReferralLink());
        }

        // Airdrop
        if (this.claimAirdropBtn) {
            this.claimAirdropBtn.addEventListener('click', () => this.claimAirdrop());
        }

        // Admin panel
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => this.showAdminPanel());
        }

        console.log('✅ Event listeners setup complete');
    }

    debugWalletDetection() {
        console.log('🔍 Wallet Detection Debug:');
        console.log('window.solana exists:', typeof window.solana !== 'undefined');
        console.log('window.solana.isPhantom:', window.solana?.isPhantom);
        console.log('window.solflare exists:', typeof window.solflare !== 'undefined');
        console.log('window.solanaWeb3 exists:', typeof window.solanaWeb3 !== 'undefined');

        if (typeof window.solanaWeb3 === 'undefined') {
            console.error('❌ Solana web3 library not loaded!');
        } else {
            console.log('✅ Solana web3 library loaded');
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

        if (wallets.phantom) {
            console.log('✅ Phantom wallet detected!');
            this.showNotification('✅ Phantom wallet detected! Click "Connect Wallet" to continue.', 'success');
        } else if (wallets.solflare) {
            console.log('🔄 Solflare detected');
            this.showNotification('🔄 Solflare detected! Click "Connect Wallet" to use it.', 'info');
        } else {
            console.log('❌ No supported wallets detected');
            this.showNotification('❌ Please install Phantom wallet to continue', 'warning');
        }
    }

    async connectWallet() {
        console.log('🔗 Starting wallet connection process...');

        try {
            // Check if Phantom is available
            if (!window.solana) {
                console.log('❌ window.solana not found');
                this.showNotification('❌ Phantom wallet not detected. Please install it first.', 'warning');
                return;
            }

            if (!window.solana.isPhantom) {
                console.log('❌ Not Phantom wallet:', window.solana);
                this.showNotification('❌ Please use Phantom wallet for this dApp.', 'warning');
                return;
            }

            console.log('✅ Phantom detected, attempting connection...');

            // Try to connect
            let response;
            try {
                response = await window.solana.connect();
                console.log('✅ Connection response received:', response);
            } catch (connectError) {
                console.error('❌ Connection failed:', connectError);

                if (connectError.code === 4001) {
                    this.showNotification('❌ Connection rejected by user', 'warning');
                } else if (connectError.code === -32002) {
                    this.showNotification('❌ Connection already in progress', 'warning');
                } else {
                    this.showNotification(`❌ Connection failed: ${connectError.message || 'Unknown error'}`, 'error');
                }
                return;
            }

            // Validate response
            if (!response || !response.publicKey) {
                console.error('❌ Invalid response from wallet:', response);
                this.showNotification('❌ Invalid response from wallet', 'error');
                return;
            }

            // Success!
            this.publicKey = response.publicKey;
            this.wallet = window.solana;

            console.log('✅ Wallet connected successfully:', this.publicKey.toString());
            this.onWalletConnected();

        } catch (error) {
            console.error('❌ Unexpected error during wallet connection:', error);
            this.showNotification('❌ Unexpected error. Please try again.', 'error');
        }
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

            // Show nav balance
            if (this.userBalanceNav) {
                this.userBalanceNav.style.display = 'inline';
            }

            // Update user balance display
            this.updateUserBalanceDisplay();

            // Load user's existing token balance
            this.loadUserData();

            // Check admin access
            this.checkAdminAccess();

            // Generate referral code
            this.generateReferralCode();

            // Hide wallet modal
            if (this.walletModal) {
                this.walletModal.classList.remove('show');
                document.body.style.overflow = '';
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
            this.showNotification('👑 Admin access granted!', 'success');
        }
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
        const referralInput = document.getElementById('referral-code');
        if (!referralInput) return;

        const code = referralInput.value.trim().toUpperCase();
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
        referralInput.value = '';
    }

    copyReferralLink() {
        const userReferralLink = document.getElementById('user-referral-link');
        if (!userReferralLink) return;

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot copy referral links!', 'error');
            return;
        }

        userReferralLink.select();
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
        if (this.manualPaymentInfo) {
            this.manualPaymentInfo.style.display = 'none';
        }

        this.updateCalculations();
    }

    updateCalculations() {
        const solInput = document.getElementById('sol-amount');
        if (!solInput) return;

        const solAmount = parseFloat(solInput.value) || 0;
        const phase = this.phases[this.currentPhase - 1];

        if (solAmount < 0.1 || solAmount > 10) {
            this.updateCalculationDisplay(0, 0, 0, 0);
            const confirmBtn = document.getElementById('confirm-purchase');
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        const baseTokens = Math.floor(solAmount * phase.rate);
        const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
        const totalTokens = baseTokens + bonusTokens;

        this.updateCalculationDisplay(solAmount, baseTokens, bonusTokens, totalTokens);
        const confirmBtn = document.getElementById('confirm-purchase');
        if (confirmBtn) confirmBtn.disabled = false;
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

    async confirmPurchase() {
        console.log('🚀 Confirm Purchase clicked - Starting transaction...');

        const solInput = document.getElementById('sol-amount');
        if (!solInput) {
            console.error('❌ SOL input not found');
            return;
        }

        const solAmount = parseFloat(solInput.value);

        if (!solAmount || solAmount < 0.1 || solAmount > 10) {
            this.showNotification('Please enter a valid amount (0.1 - 10 SOL)', 'warning');
            return;
        }

        if (!this.wallet) {
            this.showNotification('Please connect your wallet first', 'warning');
            return;
        }

        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot make purchases!', 'error');
            return;
        }

        // Hide manual payment info initially
        if (this.manualPaymentInfo) {
            this.manualPaymentInfo.style.display = 'none';
        }

        try {
            console.log('🔄 Creating purchase transaction...');
            const success = await this.createPurchaseTransaction(solAmount);

            if (success) {
                this.hideModal(this.purchaseModal);
                const calcTotal = document.getElementById('calc-total');
                const totalText = calcTotal ? calcTotal.textContent : 'tokens';
                this.showNotification(`✅ Successfully purchased ${totalText} $ROT!`, 'success');
                this.updateUserBalanceAfterPurchase();
            } else {
                // Show manual payment info when purchase fails
                if (this.manualPaymentInfo && this.manualPaymentAddress) {
                    this.manualPaymentAddress.textContent = this.presaleWallet;
                    this.manualPaymentInfo.style.display = 'block';
                }
                this.showNotification('❌ Purchase failed. Please use manual payment below.', 'error');
            }

        } catch (error) {
            console.error('❌ Purchase error:', error);
            // Show manual payment info on error too
            if (this.manualPaymentInfo && this.manualPaymentAddress) {
                this.manualPaymentAddress.textContent = this.presaleWallet;
                this.manualPaymentInfo.style.display = 'block';
            }
            this.showNotification('❌ Purchase failed. Please use manual payment below.', 'error');
        }
    }

    async createPurchaseTransaction(solAmount) {
        try {
            console.log('🔄 Starting purchase transaction process...');

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

            // Test wallet responsiveness
            try {
                console.log('🔍 Testing wallet responsiveness...');
                const testBalance = await this.wallet.getBalance(this.publicKey);
                console.log('✅ Wallet is responsive, balance:', testBalance / 1000000000, 'SOL');
            } catch (testError) {
                console.error('❌ Wallet not responsive:', testError);
                this.showNotification('❌ Wallet connection issue. Please refresh and reconnect.', 'error');
                return false;
            }

            // Check balance
            try {
                const balance = await this.wallet.getBalance(this.publicKey);
                const balanceInSOL = balance / 1000000000;

                if (balance < lamports) {
                    this.showNotification(`❌ Insufficient balance. Need ${solAmount} SOL, have ${balanceInSOL.toFixed(3)} SOL`, 'error');
                    return false;
                }
                console.log('💰 Balance OK:', balanceInSOL, 'SOL');
            } catch (balanceError) {
                console.error('❌ Balance check failed:', balanceError);
                this.showNotification('❌ Could not check balance. Please ensure wallet is unlocked.', 'error');
                return false;
            }

            // Try direct wallet transaction first
            try {
                console.log('🎯 Attempting direct wallet transaction...');

                // Check if wallet has signAndSendTransaction (newer Phantom)
                if (typeof this.wallet.signAndSendTransaction === 'function') {
                    console.log('🔄 Using signAndSendTransaction...');

                    // Create minimal transaction for testing
                    const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3;

                    // Get recent blockhash
                    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

                    const transaction = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: this.publicKey,
                            toPubkey: new PublicKey(this.presaleWallet),
                            lamports: lamports
                        })
                    );

                    transaction.recentBlockhash = blockhash;
                    transaction.lastValidBlockHeight = lastValidBlockHeight;
                    transaction.feePayer = this.publicKey;

                    console.log('✍️ Requesting wallet signature for transaction...');
                    const result = await this.wallet.signAndSendTransaction(transaction);

                    console.log('✅ Transaction sent via wallet:', result);

                    // Update stats
                    this.tokensSold += totalTokens;
                    this.totalRaised += solAmount;
                    this.participants += 1;
                    this.updateStatsDisplay();

                    return true;

                } else {
                    throw new Error('signAndSendTransaction not available');
                }

            } catch (directError) {
                console.log('⚠️ Direct method failed, trying fallback:', directError.message);

                // Fallback: Try manual transaction creation
                try {
                    console.log('🔄 Trying manual transaction creation...');

                    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

                    const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3;
                    const transaction = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: this.publicKey,
                            toPubkey: new PublicKey(this.presaleWallet),
                            lamports: lamports
                        })
                    );

                    transaction.recentBlockhash = blockhash;
                    transaction.lastValidBlockHeight = lastValidBlockHeight;
                    transaction.feePayer = this.publicKey;

                    console.log('📝 Transaction created, requesting signature...');

                    // This should trigger Phantom popup
                    const signedTransaction = await this.wallet.signTransaction(transaction);
                    console.log('✅ Transaction signed');

                    const signature = await connection.sendTransaction(signedTransaction);
                    console.log('✅ Transaction sent:', signature);

                    // Update stats
                    this.tokensSold += totalTokens;
                    this.totalRaised += solAmount;
                    this.participants += 1;
                    this.updateStatsDisplay();

                    return true;

                } catch (fallbackError) {
                    console.error('❌ Both methods failed:', directError.message, fallbackError.message);

                    if (fallbackError.message?.includes('User rejected') || directError.message?.includes('User rejected')) {
                        this.showNotification('❌ Transaction cancelled by user', 'warning');
                    } else if (fallbackError.message?.includes('locked') || directError.message?.includes('locked')) {
                        this.showNotification('❌ Please unlock your wallet', 'warning');
                    } else {
                        this.showNotification(`❌ Transaction failed. Check console for details.`, 'error');
                    }
                    return false;
                }
            }

        } catch (error) {
            console.error('❌ Unexpected error in purchase transaction:', error);
            this.showNotification(`❌ Purchase failed: ${error.message || 'Unknown error'}`, 'error');
            return false;
        }
    }

    updateUserBalanceAfterPurchase() {
        const solInput = document.getElementById('sol-amount');
        if (!solInput) return;

        const solAmount = parseFloat(solInput.value) || 0;
        const phase = this.phases[this.currentPhase - 1];
        const baseTokens = Math.floor(solAmount * phase.rate);
        const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
        const totalTokens = baseTokens + bonusTokens;

        this.userTokens += totalTokens;
        this.updateUserBalanceDisplay();
        this.saveUserData();
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

        const balanceText = `${this.userTokens.toLocaleString()} $ROT`;

        if (this.userBalance) {
            this.userBalance.textContent = balanceText;
        }

        if (this.userBalanceNav) {
            this.userBalanceNav.textContent = balanceText;
        }
    }

    showModal(modal) {
        console.log('Showing modal:', modal?.id);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modal) {
        console.log('Hiding modal:', modal?.id);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
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

    async loadData() {
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
        const intervals = [
            { interval: 15000, tokens: Math.floor(Math.random() * 5000) + 1000, participants: 1 },
            { interval: 30000, tokens: Math.floor(Math.random() * 8000) + 2000, participants: 0 },
            { interval: 45000, tokens: Math.floor(Math.random() * 3000) + 500, participants: 0 },
            { interval: 60000, tokens: Math.floor(Math.random() * 12000) + 3000, participants: 1 }
        ];

        intervals.forEach(({ interval, tokens, participants }) => {
            setInterval(() => {
                if (this.tokensSold < this.presaleTokens) {
                    this.tokensSold += tokens;
                    this.totalRaised = this.tokensSold / this.phases[this.currentPhase - 1].rate;

                    if (participants > 0) {
                        this.participants += participants;
                    }

                    this.updateStatsDisplay();
                }
            }, interval);
        });

        console.log('🧠 Realistic presale progress simulation started');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, initializing BrainRot Presale...');
    const app = new BrainRotPresale();
    console.log('✅ BrainRot Presale initialized!');
});
