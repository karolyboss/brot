    async createPurchaseTransaction(solAmount) {
        try {
            console.log('🚀 CONFIRM PURCHASE CLICKED - Starting transaction...');

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
                publicKeyExists: !!this.publicKey,
                walletType: this.wallet?.constructor?.name || 'Unknown'
            });

            // CRITICAL: Validate wallet connection FIRST
            if (!this.wallet || !this.publicKey) {
                console.error('❌ WALLET NOT CONNECTED');
                this.showNotification('❌ Please connect your wallet first!', 'error');
                return false;
            }

            // Test wallet responsiveness
            let testBalance;
            try {
                console.log('🔍 Testing wallet connection...');
                testBalance = await this.wallet.getBalance(this.publicKey);
                console.log('✅ Wallet responsive, balance:', testBalance / 1000000000, 'SOL');
            } catch (testError) {
                console.error('❌ Wallet not responsive:', testError);
                this.showNotification('❌ Wallet connection issue. Please reconnect your wallet.', 'error');
                return false;
            }

            // Check balance
            try {
                const balance = await this.wallet.getBalance(this.publicKey);
                const balanceInSOL = balance / 1000000000;

                if (balance < lamports) {
                    this.showNotification(`❌ Need ${solAmount} SOL, have ${balanceInSOL.toFixed(3)} SOL`, 'error');
                    return false;
                }
                console.log('💰 Balance OK:', balanceInSOL, 'SOL');
            } catch (balanceError) {
                console.error('❌ Balance check failed:', balanceError);
                this.showNotification('❌ Could not check balance. Please ensure wallet is unlocked.', 'error');
                return false;
            }

            // Try simple approach first - direct wallet interaction
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

                    this.showNotification(`✅ Success! ${totalTokens.toLocaleString()} $ROT purchased!`, 'success');
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

                    this.showNotification(`✅ Success! ${totalTokens.toLocaleString()} $ROT purchased!`, 'success');
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
            console.error('❌ Unexpected error:', error);
            this.showNotification(`❌ Error: ${error.message || 'Unknown error'}`, 'error');
            return false;
        }
    }
