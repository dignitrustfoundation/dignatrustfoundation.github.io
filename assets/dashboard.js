// Digna Dashboard JavaScript
document.addEventListener("DOMContentLoaded", async function() {

    const VAULT_ADDRESS = "0xC693a927478CE1A312b7322c0442c5edEfB5c45F";
    const TOKEN_ADDRESS = "0x5AA59f0fC809fDd2813ed1Bc2EC47d8579C89F2d";

    const VAULT_ABI = [
        "function stake(uint256 amount)",
        "function unstake(uint256 amount)",
        "function claim()",
        "function stakedOf(address) view returns(uint256)",
        "function pendingRewards(address) view returns(uint256)"
    ];

    const ERC20_ABI = [
        "function approve(address spender, uint256 amount)",
        "function balanceOf(address owner) view returns(uint256)",
        "function decimals() view returns(uint8)"
    ];

    let provider, signer, walletAddress, token, vault;

    // Get DOM elements
    const connectWalletBtn = document.getElementById("connectWallet");
    const stakingPanel = document.getElementById("stakingPanel");
    const connectPrompt = document.getElementById("connectPrompt");
    const walletAddressDisplay = document.getElementById("walletAddressDisplay");
    const dgnBalanceDisplay = document.getElementById("dgnBalance");
    const userStakedDisplay = document.getElementById("userStaked");
    const userRewardsDisplay = document.getElementById("userRewards");
    const stakeBtn = document.getElementById("stakeBtn");
    const unstakeBtn = document.getElementById("unstakeBtn");
    const claimBtn = document.getElementById("claimBtn");
    const stakeAmountInput = document.getElementById("stakeAmount");

    // Connect Wallet
    connectWalletBtn.onclick = async () => {
        try {
            if (!window.ethereum) {
                alert("Please install MetaMask to use this feature.");
                return;
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            walletAddress = await signer.getAddress();

            // Update UI
            const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
            walletAddressDisplay.textContent = shortAddress;
            connectWalletBtn.textContent = "Connected";
            connectWalletBtn.disabled = true;
            connectWalletBtn.style.opacity = "0.7";

            // Initialize contracts
            token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, signer);
            vault = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);

            // Show staking panel
            stakingPanel.classList.remove("hidden");
            connectPrompt.classList.add("hidden");

            // Load data
            await refreshData();

        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    };

    // Refresh Data
    async function refreshData() {
        try {
            const balance = await token.balanceOf(walletAddress);
            const staked = await vault.stakedOf(walletAddress);
            const rewards = await vault.pendingRewards(walletAddress);

            const decimals = await token.decimals();
            const div = ethers.BigNumber.from(10).pow(decimals);

            dgnBalanceDisplay.textContent = `${ethers.utils.formatUnits(balance, decimals)} DGN`;
            userStakedDisplay.textContent = `${ethers.utils.formatUnits(staked, decimals)} DGN`;
            userRewardsDisplay.textContent = `${ethers.utils.formatUnits(rewards, decimals)} DGN`;

        } catch (error) {
            console.error("Error refreshing data:", error);
        }
    }

    // Stake Button
    stakeBtn.onclick = async () => {
        try {
            const amount = stakeAmountInput.value;
            if (!amount || parseFloat(amount) <= 0) {
                alert("Please enter a valid amount to stake.");
                return;
            }

            stakeBtn.textContent = "Staking...";
            stakeBtn.disabled = true;

            const decimals = await token.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            // Approve token spending
            const approveTx = await token.approve(VAULT_ADDRESS, amountWei);
            await approveTx.wait();

            // Stake tokens
            const stakeTx = await vault.stake(amountWei);
            await stakeTx.wait();

            alert("Successfully staked!");
            stakeAmountInput.value = "";
            await refreshData();

        } catch (error) {
            console.error("Error staking:", error);
            alert("Failed to stake. Please try again.");
        } finally {
            stakeBtn.textContent = "Stake";
            stakeBtn.disabled = false;
        }
    };

    // Unstake Button
    unstakeBtn.onclick = async () => {
        try {
            const amount = stakeAmountInput.value;
            if (!amount || parseFloat(amount) <= 0) {
                alert("Please enter a valid amount to unstake.");
                return;
            }

            unstakeBtn.textContent = "Unstaking...";
            unstakeBtn.disabled = true;

            const decimals = await token.decimals();
            const amountWei = ethers.utils.parseUnits(amount, decimals);

            // Unstake tokens
            const unstakeTx = await vault.unstake(amountWei);
            await unstakeTx.wait();

            alert("Successfully unstaked!");
            stakeAmountInput.value = "";
            await refreshData();

        } catch (error) {
            console.error("Error unstaking:", error);
            alert("Failed to unstake. Please try again.");
        } finally {
            unstakeBtn.textContent = "Unstake";
            unstakeBtn.disabled = false;
        }
    };

    // Claim Button
    claimBtn.onclick = async () => {
        try {
            claimBtn.textContent = "Claiming...";
            claimBtn.disabled = true;

            const claimTx = await vault.claim();
            await claimTx.wait();

            alert("Successfully claimed rewards!");
            await refreshData();

        } catch (error) {
            console.error("Error claiming rewards:", error);
            alert("Failed to claim rewards. Please try again.");
        } finally {
            claimBtn.textContent = "Claim Rewards";
            claimBtn.disabled = false;
        }
    };

    // Handle account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                // User disconnected wallet
                location.reload();
            } else {
                // User switched account
                location.reload();
            }
        });

        window.ethereum.on('chainChanged', () => {
            // User changed network
            location.reload();
        });
    }
});
