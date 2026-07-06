// Grab header nodes
const profileToggle = document.getElementById('profile-toggle');
const profileDropdown = document.getElementById('profile-dropdown');
const navBtns = document.querySelectorAll('.nav-btn');
const roomLinks = document.querySelectorAll('.active-room-link');

// profile image upload selectors
const dropdownProfilePic = document.getElementById('dropdown-profile-pic');
const profileUploadInput = document.getElementById('profile-upload-input');
const profileIconContainer = document.getElementById('profile-icon');
const avatarIcon = document.getElementById('avatar-icon');

// Settings Selectors
const displayUsername = document.getElementById('display-username');
const settingsUsernameInput = document.getElementById('settings-username-input');
const settingsThemeSelect = document.getElementById('settings-theme-select');
const bgUploadBtn = document.getElementById('bg-upload-btn');
const bgUploadInput = document.getElementById('bg-upload-input');
const settingsAccordionToggle = document.getElementById('settings-accordion-toggle');
const settingsAccordionWrapper = document.getElementById('settings-accordion-wrapper');

// Bet Builder Selectors
const betCreatorForm = document.getElementById('bet-creator-form');
const activeBetsTargetList = document.getElementById('active-bets-target-list');
const historyBetsTargetList = document.getElementById('history-bets-target-list');
const dashboardActiveSettlement = document.getElementById('dashboard-active-settlement');

// Accumulator variables
const addTeamItemBtn = document.getElementById('add-team-item-btn');
const addedMatchesParagraph = document.getElementById('added-matches-paragraph');
const totalOddsInput = document.getElementById('creator-odd-total');
const creatorStakeInput = document.getElementById('creator-stake');

// Arrays to explicitly hold match details and individual odds
let stagedMatches = [];
let stagedOddsPool = []; 
let accumulatedOdds = 1.00;
let betRuns = JSON.parse(localStorage.getItem('betRunsCache')) || [];

function applyProfileImage(imageDataUrl) {
    profileIconContainer.innerHTML = ''; 
    profileIconContainer.style.backgroundImage = `url('${imageDataUrl}')`;
    profileIconContainer.style.backgroundSize = 'cover';
    profileIconContainer.style.backgroundPosition = 'center';
    if (avatarIcon) avatarIcon.style.display = 'none';
    dropdownProfilePic.style.backgroundImage = `url('${imageDataUrl}')`;
    dropdownProfilePic.style.backgroundSize = 'cover';
    dropdownProfilePic.style.backgroundPosition = 'center';
}

function applyThemeSetting(themeClass) {
    document.body.className = '';
    document.body.classList.add(`theme-${themeClass}`);
}

function switchPage(targetPageId) {
    document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
    const targetView = document.getElementById(`${targetPageId}-view`);
    if (targetView) targetView.classList.add('active');
}

// Render Engine
function updateBetsDisplayEngine() {
    localStorage.setItem('betRunsCache', JSON.stringify(betRuns));

    // Calculate rolled balance to auto-fill next Day Stake box if previous won
    const wonRuns = betRuns.filter(r => r.status === 'won');
    if (wonRuns.length > 0) {
        creatorStakeInput.value = Math.floor(wonRuns[wonRuns.length - 1].win);
    }

    // 1. Dashboard Settlements
    const activeUnsettled = betRuns.filter(r => r.status === 'active');
    if (activeUnsettled.length === 0) {
        dashboardActiveSettlement.innerHTML = `<p style="color: #64748b; font-size: 0.8rem; text-align: center; padding: 10px;">No open un-settled bets slips currently found.</p>`;
    } else {
        dashboardActiveSettlement.innerHTML = activeUnsettled.map(run => `
            <div class="settlement-block">
                <div style="font-size:0.78rem; font-weight:bold; color:#1e293b;">Day ${run.day} Coupon (${run.time})</div>
                <div style="font-size:0.8rem; margin: 6px 0; color:#475569; line-height:1.3;">${run.summaryText}</div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                    <span style="font-size:0.8rem; font-weight:600;">Outcome:</span>
                    <button class="settle-action-btn" style="background-color:#2563eb;" onclick="settleSlipRow('${run.id}', 'won')">Won ✅</button>
                    <button class="settle-action-btn" style="background-color:#ef4444;" onclick="settleSlipRow('${run.id}', 'lost')">Lost ❌</button>
                </div>
            </div>
        `).join('');
    }

    // 2. Active Bets View
    if (activeUnsettled.length === 0) {
        activeBetsTargetList.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px; font-size:0.85rem;">No current active operations running.</p>`;
    } else {
        activeBetsTargetList.innerHTML = activeUnsettled.map(run => `
            <div class="history-dropdown-card open" style="border-left: 4px solid #00b0ff;">
                <div class="history-header-toggle">
                    <p class="history-title-paragraph"><strong>Active Rollover Run</strong> (Day ${run.day})</p>
                </div>
                <div class="history-content-collapsible" style="display:block; padding:10px;">
                    <table class="history-data-table">
                        <thead><tr><th>DAY</th><th>STAKE</th><th>ODD</th><th>WIN</th><th>TIME</th></tr></thead>
                        <tbody><tr><td>${run.day}</td><td>${run.stake}</td><td>${run.odd}</td><td>${run.win}</td><td>${run.time}</td></tr></tbody>
                    </table>
                    <div style="margin-top:8px; font-size:0.78rem; color:#475569; padding: 4px; background:#f8fafc; border-radius:4px;">
                        <strong>Selections:</strong> ${run.summaryText}
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 3. My Bets View
    const historicalRuns = betRuns.filter(r => r.status === 'won' || r.status === 'lost');
    if (historicalRuns.length === 0) {
        historyBetsTargetList.innerHTML = `<p style="color: #64748b; text-align: center; padding: 20px; font-size:0.85rem;">No historical data records verified yet.</p>`;
    } else {
        historyBetsTargetList.innerHTML = historicalRuns.map(run => `
            <div class="history-dropdown-card">
                <div class="history-header-toggle" onclick="this.parentElement.classList.toggle('open')">
                    <p class="history-title-paragraph"><strong>${run.betName} (Day ${run.day})</strong>: ${run.summaryText}</p>
                    <span style="font-size:0.9rem; margin-left:6px; flex-shrink:0;">${run.status === 'won' ? '✅':'❌'}</span>
                </div>
                <div class="history-content-collapsible" style="padding:10px;">
                    <table class="history-data-table">
                        <thead><tr><th>DAY</th><th>STAKE</th><th>ODD</th><th>WIN</th><th>STATUS</th></tr></thead>
                        <tbody>
                            <tr>
                                <td>${run.day}</td>
                                <td>${run.stake}</td>
                                <td>${run.odd}</td>
                                <td>${run.win}</td>
                                <td><span style="font-weight:bold; color:${run.status === 'won' ? '#2563eb':'#ef4444'}">${run.status === 'won' ? '✅':'❌'}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    }
}

// Settlement Action
window.settleSlipRow = function(slipId, outcome) {
    const itemIndex = betRuns.findIndex(r => r.id === slipId);
    if (itemIndex > -1) {
        betRuns[itemIndex].status = outcome;
        updateBetsDisplayEngine();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // 1. LOAD CACHE DATA VALUES FROM LOCALSTORAGE
    const savedProfileImage = localStorage.getItem('userProfileImage');
    if (savedProfileImage) applyProfileImage(savedProfileImage);

    const savedUsername = localStorage.getItem('userProfileUsername') || 'Savings User';
    displayUsername.innerText = savedUsername;
    settingsUsernameInput.value = savedUsername;

    const savedTheme = localStorage.getItem('userProfileTheme') || 'default';
    settingsThemeSelect.value = savedTheme;
    applyThemeSetting(savedTheme);

    // Only load custom background image if no solid theme overrides it or if saved intentionally
    const savedCustomBg = localStorage.getItem('userProfileCustomBg');
    if (savedCustomBg && localStorage.getItem('useCustomBgActive') === 'true') {
        document.body.style.backgroundImage = `url('${savedCustomBg}')`;
    }

    // 2. TOGGLE SETTINGS ACCORDION ON CLICK
    settingsAccordionToggle.addEventListener('click', function(e) {
        e.stopPropagation(); 
        settingsAccordionWrapper.classList.toggle('open');
    });

    // 3. LIVE PROFILE SETTINGS HANDLERS
    settingsUsernameInput.addEventListener('input', function() {
        const val = this.value.trim() || 'Savings User';
        displayUsername.innerText = val;
        localStorage.setItem('userProfileUsername', val);
    });

    // Theme Selector Change Handler
    settingsThemeSelect.addEventListener('change', function() {
        // FIX: Clear the inline style background image so solid colors can show up!
        document.body.style.backgroundImage = 'none';
        localStorage.setItem('useCustomBgActive', 'false');
        
        applyThemeSetting(this.value);
        localStorage.setItem('userProfileTheme', this.value);
    });

    // Custom Canvas Wallpaper File Imports
    bgUploadBtn.addEventListener('click', () => bgUploadInput.click());
    bgUploadInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                document.body.style.backgroundImage = `url('${reader.result}')`;
                localStorage.setItem('userProfileCustomBg', reader.result);
                localStorage.setItem('useCustomBgActive', 'true'); // Flag that custom wall is active
            });
            reader.readAsDataURL(file);
        }
    });

    dropdownProfilePic.addEventListener('click', () => profileUploadInput.click());
    profileUploadInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                applyProfileImage(reader.result);
                localStorage.setItem('userProfileImage', reader.result);
            });
            reader.readAsDataURL(file);
        }
    });

    // Accumulator Team Appender (+)
    addTeamItemBtn.addEventListener('click', function(event) {
        event.preventDefault(); 
        
        const homeInput = document.getElementById('match-home');
        const awayInput = document.getElementById('match-away');
        const predInput = document.getElementById('match-pred');
        const oddInput = document.getElementById('match-odd');

        const h = homeInput.value.trim();
        const a = awayInput.value.trim();
        const p = predInput.value.trim();
        const o = parseFloat(oddInput.value);

        if (!h || !a || !p || isNaN(o)) {
            alert("Please fill all single row match properties (Home, Away, Bet, Odds) before adding.");
            return;
        }

        stagedMatches.push(`${h} vs ${a} (${p} @${o})`);
        stagedOddsPool.push(o);
        
        let currentTotalMultiplier = 1.00;
        for (let i = 0; i < stagedOddsPool.length; i++) {
            currentTotalMultiplier = currentTotalMultiplier * stagedOddsPool[i];
        }
        accumulatedOdds = currentTotalMultiplier;
        totalOddsInput.value = accumulatedOdds.toFixed(2);

        addedMatchesParagraph.innerText = stagedMatches.join(' | ');
        
        homeInput.value = '';
        awayInput.value = '';
        predInput.value = '';
        oddInput.value = '';

        homeInput.focus();
    });

    // Create Betslip Form Submit
    betCreatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (stagedMatches.length === 0) {
            alert("Please add at least one match to your coupon using the '+' button first.");
            return;
        }

        const d = new Date();
        const currentChallengeDate = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        const stakeVal = parseFloat(creatorStakeInput.value);
        
        const totalCalculatedWin = (stakeVal * accumulatedOdds).toFixed(2);
        const currentDayNumber = betRuns.length + 1;

        const newSlip = {
            id: 'slip_' + Date.now(),
            betName: currentChallengeDate,
            stake: stakeVal,
            odd: accumulatedOdds.toFixed(2),
            win: totalCalculatedWin,
            time: document.getElementById('creator-time').value,
            summaryText: stagedMatches.join(' | '),
            day: currentDayNumber,
            status: 'active'
        };

        betRuns.push(newSlip);
        
        stagedMatches = [];
        stagedOddsPool = [];
        accumulatedOdds = 1.00;
        
        betCreatorForm.reset();
        
        totalOddsInput.value = "1.00";
        addedMatchesParagraph.innerText = "No matches staging inside this coupon yet. Append fields below.";

        updateBetsDisplayEngine();
        alert(`Day ${currentDayNumber} coupon added successfully!`);
    });

    // Restrict dropdown click closing on input items interaction
    profileDropdown.addEventListener('click', (e) => e.stopPropagation());

    profileToggle.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        profileDropdown.classList.toggle('show'); 
    });

    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            switchPage(this.getAttribute('data-page'));
        });
    });

    roomLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetRoom = this.getAttribute('data-target');
            navBtns.forEach(btn => {
                btn.getAttribute('data-page') === targetRoom ? btn.classList.add('active') : btn.classList.remove('active');
            });
            switchPage(targetRoom);
            profileDropdown.classList.remove('show');
        });
    });

    document.addEventListener('click', (event) => {
        if (!profileToggle.contains(event.target) && !profileDropdown.contains(event.target)) {
            profileDropdown.classList.remove('show');
        }
    });

    updateBetsDisplayEngine();
});
