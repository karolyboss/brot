// BrainRot Presale Website JavaScript - Fixed Version

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

        this.initializeApp();
    }

    async initializeApp() {
        this.setupElements();
        this.setupEventListeners();
        this.startPhaseTimer();
        this.loadData();
        this.debugWalletDetection();
        setTimeout(() => this.attemptWalletDetection(), 1000);
    }

    setupElements() {
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
    }

    setupEventListeners() {
        // Wallet connection
        this.connectBtn?.addEventListener('click', () => {
            console.log('Connect wallet button clicked');
            this.showModal(this.walletModal);
        });

        const phantomConnect = document.getElementById('phantom-connect');
        if (phantomConnect) {
            phantomConnect.addEventListener('click', () => {
                console.log('Phantom connect button clicked');
                this.connectWallet();
            });
        }

        // Purchase
        this.buyBtn?.addEventListener('click', () => this.showPurchaseModal());
        this.solInput?.addEventListener('input', () => this.updateCalculations());
        document.getElementById('confirm-purchase')?.addEventListener('click', () => this.confirmPurchase());

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal);
                }
            });
        });

        // Referral system
        document.getElementById('apply-referral')?.addEventListener('click', () => this.applyReferral());
        document.getElementById('copy-referral')?.addEventListener('click', () => this.copyReferralLink());

        // Airdrop
        if (this.claimAirdropBtn) {
            this.claimAirdropBtn.addEventListener('click', () => this.claimAirdrop());
        }

        // Admin panel
        this.adminBtn?.addEventListener('click', () => this.showAdminPanel());
        this.adminElements.executeBtn?.addEventListener('click', () => this.executeAdminAction());
        this.adminElements.banBtn?.addEventListener('click', () => this.banUser());

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal.show').forEach(modal => this.hideModal(modal));
            }
        });
    }

    debugWalletDetection() {
        console.log('🧠 BrainRot Debug - Wallet Detection:');
        console.log('window.solana exists:', typeof window.solana !== 'undefined');
        console.log('window.solana.isPhantom:', window.solana?.isPhantom);
    }

    async attemptWalletDetection() {
        const wallets = {
            phantom: !!(window.solana && window.solana.isPhantom),
            solflare: !!window.solflare,
            backpack: !!window.backpack,
            coinbase: !!window.coinbaseSolana
        };

        console.log('Available wallets:', wallets);

        if (wallets.phantom) {
            console.log('✅ Phantom detected!');
            this.showNotification('Phantom wallet detected!', 'success');
        } else if (wallets.solflare) {
            console.log('🔄 Solflare detected');
            this.showNotification('Solflare detected! Click connect to use it.', 'info');
        } else {
            console.log('❌ No supported wallets detected');
            this.showNotification('Please install Phantom wallet to continue', 'warning');
        }
    }

    async connectWallet() {
        try {
            console.log('Starting wallet connection...');

            if (!window.solana) {
                this.showNotification('Phantom wallet not detected. Please install it first.', 'warning');
                return;
            }

            if (!window.solana.isPhantom) {
                this.showNotification('Please use Phantom wallet for this dApp.', 'warning');
                return;
            }

            console.log('Phantom detected, attempting connection...');

            const response = await window.solana.connect();
            console.log('Connection response:', response);

            if (!response || !response.publicKey) {
                this.showNotification('Invalid response from wallet', 'error');
                return;
            }

            this.publicKey = response.publicKey;
            this.wallet = window.solana;

            console.log('Wallet connected successfully:', this.publicKey.toString());

            this.onWalletConnected();

        } catch (error) {
            console.error('Wallet connection error:', error);
            if (error.code === 4001) {
                this.showNotification('Connection rejected by user', 'warning');
            } else {
                this.showNotification(`Connection failed: ${error.message || 'Unknown error'}`, 'error');
            }
        }
    }

    onWalletConnected() {
        console.log('Wallet connected, updating UI...');

        try {
            // Update connect button
            if (this.connectBtn) {
                this.connectBtn.textContent = `${this.publicKey.toString().slice(0, 4)}...${this.publicKey.toString().slice(-4)}`;
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

            // Update wallet address display (first 15 characters)
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

            this.showNotification('Wallet connected successfully!', 'success');

        } catch (error) {
            console.error('Error updating UI after wallet connection:', error);
            this.showNotification('Connected successfully! (UI update had minor issues)', 'success');
        }
    }

    checkAdminAccess() {
        if (this.publicKey && this.publicKey.toString() === this.adminWallet) {
            this.isAdmin = true;
            if (this.adminBtn) {
                this.adminBtn.style.display = 'block';
            }
            this.showNotification('Admin access granted!', 'success');
        }
    }

    generateReferralCode() {
        if (!this.publicKey) return;

        const code = this.publicKey.toString().slice(0, 8).toUpperCase();
        this.userReferralLink.value = `${window.location.origin}?ref=${code}`;

        const existingCode = localStorage.getItem(`brainrot_ref_${this.publicKey.toString()}`);
        if (!existingCode) {
            localStorage.setItem(`brainrot_ref_${this.publicKey.toString()}`, code);
        }
    }

    applyReferral() {
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
        if (this.publicKey && this.bannedUsers.has(this.publicKey.toString())) {
            this.showNotification('Banned users cannot copy referral links!', 'error');
            return;
        }

        this.userReferralLink.select();
        document.execCommand('copy');
        this.showNotification('Referral link copied!', 'success');
    }

    showPurchaseModal() {
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
        document.getElementById('modal-phase').textContent = `Phase ${this.currentPhase}`;
        document.getElementById('modal-rate').textContent = `${phase.rate.toLocaleString()} ROT = 1 SOL`;
        document.getElementById('modal-bonus').textContent = `${phase.bonus}%`;

        // Hide manual payment info when opening modal for new purchase
        if (this.manualPaymentInfo) {
            this.manualPaymentInfo.style.display = 'none';
        }

        this.updateCalculations();
    }

    updateCalculations() {
        const solAmount = parseFloat(this.solInput.value) || 0;
        const phase = this.phases[this.currentPhase - 1];

        if (solAmount < 0.1 || solAmount > 10) {
            this.updateCalculationDisplay(0, 0, 0, 0);
            document.getElementById('confirm-purchase').disabled = true;
            return;
        }

        const baseTokens = Math.floor(solAmount * phase.rate);
        const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
        const totalTokens = baseTokens + bonusTokens;

        this.updateCalculationDisplay(solAmount, baseTokens, bonusTokens, totalTokens);
        document.getElementById('confirm-purchase').disabled = false;
    }

    updateCalculationDisplay(sol, base, bonus, total) {
        document.getElementById('calc-sol').textContent = sol.toFixed(1);
        document.getElementById('calc-tokens').textContent = base.toLocaleString();
        document.getElementById('calc-bonus-tokens').textContent = bonus.toLocaleString();
        document.getElementById('calc-total').textContent = total.toLocaleString();
    }

    async confirmPurchase() {
        const solAmount = parseFloat(this.solInput.value);

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
            const success = await this.createPurchaseTransaction(solAmount);

            if (success) {
                this.hideModal(this.purchaseModal);
                this.showNotification(`Successfully purchased ${document.getElementById('calc-total').textContent} $ROT!`, 'success');
                this.updateUserBalanceAfterPurchase();
            } else {
                // Show manual payment info when purchase fails
                if (this.manualPaymentInfo && this.manualPaymentAddress) {
                    this.manualPaymentAddress.textContent = this.presaleWallet;
                    this.manualPaymentInfo.style.display = 'block';
                }
                this.showNotification('Purchase failed. Please use manual payment below.', 'error');
            }

        } catch (error) {
            console.error('Purchase error:', error);
            // Show manual payment info on error too
            if (this.manualPaymentInfo && this.manualPaymentAddress) {
                this.manualPaymentAddress.textContent = this.presaleWallet;
                this.manualPaymentInfo.style.display = 'block';
            }
            this.showNotification('Purchase failed. Please use manual payment below.', 'error');
        }
    }

    async createPurchaseTransaction(solAmount) {
        try {
            // Get the current phase details
            const phase = this.phases[this.currentPhase - 1];
            const baseTokens = Math.floor(solAmount * phase.rate);
            const bonusTokens = Math.floor(baseTokens * (phase.bonus / 100));
            const totalTokens = baseTokens + bonusTokens;

            // Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = Math.floor(solAmount * 1000000000);

            console.log('Creating transaction:', {
                solAmount,
                lamports,
                toAddress: this.presaleWallet,
                fromAddress: this.publicKey.toString(),
                baseTokens,
                bonusTokens,
                totalTokens
            });

            // Check if user has enough balance
            try {
                const balance = await this.wallet.getBalance(this.publicKey);
                console.log('User SOL balance:', balance / 1000000000);

                if (balance < lamports) {
                    this.showNotification(`Insufficient SOL balance. Need ${solAmount} SOL, have ${(balance / 1000000000).toFixed(2)} SOL`, 'error');
                    return false;
                }
            } catch (balanceError) {
                console.log('Balance check failed:', balanceError.message);
            }

            // Create Solana connection for devnet (for testing)
            const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));

            // Get recent blockhash using connection instead of wallet
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

            // Create transaction to send SOL to presale wallet
            const { Transaction, SystemProgram, PublicKey } = window.solanaWeb3 || solanaWeb3;

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: this.publicKey,
                    toPubkey: new PublicKey(this.presaleWallet),
                    lamports: lamports
                })
            );

            // Set blockhash and fee payer
            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = this.publicKey;

            console.log('Transaction created, requesting signature...');

            // Request wallet signature and send transaction
            const signedTransaction = await this.wallet.signTransaction(transaction);

            // Try different methods for sending transaction
            let signature;
            try {
                // Method 1: Try signAndSendTransaction (newer Phantom API)
                if (this.wallet.signAndSendTransaction) {
                    signature = await this.wallet.signAndSendTransaction(transaction);
                } else {
                    throw new Error('signAndSendTransaction not available');
                }
            } catch (method1Error) {
                try {
                    // Method 2: Manual send using connection
                    signature = await connection.sendTransaction(signedTransaction);
                } catch (method2Error) {
                    console.error('Both transaction methods failed:', method1Error, method2Error);
                    throw new Error('Unable to send transaction');
                }
            }

            console.log('Transaction sent:', signature);

            // Wait for confirmation
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            });

            // Update global stats
            this.tokensSold += totalTokens;
            this.totalRaised += solAmount;
            this.participants += 1;

            // Update UI
            this.updateStatsDisplay();

            this.showNotification(`✅ Transaction successful! ${totalTokens.toLocaleString()} $ROT purchased.`, 'success');
            return true;

        } catch (error) {
            console.error('Transaction error details:', error);

            if (error.message?.includes('User rejected')) {
                this.showNotification('❌ Transaction rejected by user', 'warning');
            } else if (error.message?.includes('insufficient funds') || error.message?.includes('balance')) {
                this.showNotification('❌ Insufficient SOL balance for transaction', 'error');
            } else if (error.message?.includes('network')) {
                this.showNotification('❌ Network error. Please check your connection and try again.', 'error');
            } else {
                this.showNotification(`❌ Transaction failed: ${error.message || 'Unknown error'}`, 'error');
            }

            return false;
        }
    }

    updateUserBalanceAfterPurchase() {
        const solAmount = parseFloat(this.solInput.value) || 0;
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

                if (this.statsElements?.phaseTimer) {
                    this.statsElements.phaseTimer.textContent = `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }
        }, 1000);
    }

    updateStatsDisplay() {
        const progressPercentage = (this.tokensSold / this.presaleTokens) * 100;
        const phase = this.phases[this.currentPhase - 1];

        this.statsElements.raised.textContent = this.totalRaised.toFixed(1);
        this.statsElements.participants.textContent = this.participants.toLocaleString();
        this.statsElements.phase.textContent = `PHASE ${this.currentPhase}`;
        this.statsElements.tokensSold.textContent = this.tokensSold.toLocaleString();
        this.statsElements.progress.style.width = `${Math.min(progressPercentage, 100)}%`;
        this.statsElements.phaseTitle.textContent = phase.name;
        this.statsElements.currentRate.textContent = `${phase.rate.toLocaleString()} ROT = 1 SOL`;
        this.statsElements.bonusAmount.textContent = `${Math.floor(phase.rate * (phase.bonus / 100)).toLocaleString()} ROT per SOL`;

        const phaseProgress = ((this.tokensSold % (this.presaleTokens / 3)) / (this.presaleTokens / 3)) * 100;
        this.statsElements.phaseProgress.textContent = `${Math.min(phaseProgress, 100).toFixed(1)}%`;
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
            this.adminElements.remaining.textContent = (this.dailyTokenLimit - this.tokensSentToday).toLocaleString();
        }
        this.updateBannedUsersList();
    }

    async executeAdminAction() {
        if (!this.isAdmin) return;

        const action = this.adminElements.action?.value;
        const userAddress = this.adminElements.userAddress?.value.trim();
        const tokenAmount = parseInt(this.adminElements.tokenAmount?.value);

        if (!userAddress || !tokenAmount) {
            this.showNotification('Please fill in all fields', 'warning');
            return;
        }

        if (tokenAmount > 20000000) {
            this.showNotification('Maximum 20M tokens per transaction', 'warning');
            return;
        }

        if (this.tokensSentToday + tokenAmount > this.dailyTokenLimit) {
            this.showNotification('Daily limit exceeded!', 'error');
            return;
        }

        try {
            if (action === 'send') {
                await this.simulateTokenSend(userAddress, tokenAmount);
                this.showNotification(`Sent ${tokenAmount.toLocaleString()} $ROT to ${userAddress.slice(0, 8)}...`, 'success');
            } else {
                await this.simulateTokenWithdraw(userAddress, tokenAmount);
                this.showNotification(`Withdrew ${tokenAmount.toLocaleString()} $ROT from ${userAddress.slice(0, 8)}...`, 'success');
            }

            this.tokensSentToday += tokenAmount;
            this.updateAdminPanel();

            if (this.adminElements.userAddress) this.adminElements.userAddress.value = '';
            if (this.adminElements.tokenAmount) this.adminElements.tokenAmount.value = '';

        } catch (error) {
            this.showNotification('Action failed. Please try again.', 'error');
        }
    }

    async simulateTokenSend(userAddress, amount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Admin sent ${amount} tokens to ${userAddress}`);
    }

    async simulateTokenWithdraw(userAddress, amount) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Admin withdrew ${amount} tokens from ${userAddress}`);
    }

    banUser() {
        if (!this.isAdmin) return;

        const address = this.adminElements.banAddress?.value.trim();
        if (!address) {
            this.showNotification('Please enter a user address', 'warning');
            return;
        }

        this.bannedUsers.add(address);
        this.updateBannedUsersList();
        if (this.adminElements.banAddress) this.adminElements.banAddress.value = '';
        this.showNotification(`User ${address.slice(0, 8)}... banned successfully!`, 'success');
    }

    updateBannedUsersList() {
        if (!this.adminElements.bannedList) return;

        if (this.bannedUsers.size === 0) {
            this.adminElements.bannedList.textContent = 'No banned users';
        } else {
            const bannedArray = Array.from(this.bannedUsers);
            this.adminElements.bannedList.innerHTML = bannedArray.map(addr =>
                `<div class="banned-user">${addr.slice(0, 8)}...${addr.slice(-4)} <button class="unban-btn" data-address="${addr}">Unban</button></div>`
            ).join('');

            // Add unban functionality
            document.querySelectorAll('.unban-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const address = e.target.dataset.address;
                    this.bannedUsers.delete(address);
                    this.updateBannedUsersList();
                    this.showNotification(`User unbanned!`, 'success');
                });
            });
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

// URL parameter handling for referrals
function getUrlParameter(name) {
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BrainRotPresale();

    const refCode = getUrlParameter('ref');
    if (refCode) {
        document.getElementById('referral-code').value = refCode;
    }

    // Setup animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('fade-in-up');
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('section').forEach(section => observer.observe(section));

    // Save data on page unload
    window.addEventListener('beforeunload', () => app.saveData());

    console.log('🧠 BrainRot Presale initialized!');
});
