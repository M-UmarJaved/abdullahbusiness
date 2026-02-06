// ============================================
// BUSINESS MANAGEMENT SYSTEM - MAIN APPLICATION
// Chaki & Cigarettes Management
// ============================================

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Replace these with your Firebase credentials from Firebase Console

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let db;
let isFirebaseReady = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    isFirebaseReady = true;
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization failed - running in demo mode', error);
}

// ============================================
// APP STATE & DATA
// ============================================

const AppState = {
    currentSection: 'dashboard',
    currentTab: 'sales',
    chakiBags: [],
    cigarSales: [],
    agents: [],
    workers: [],
    salesmen: [],
    settings: {
        workerCommission: 50,
        elecRate: 15,
        cleaningCost: 50,
        agencyPrice: 870,
        retailPrice: 900,
        wholesalePrice: 850,
        businessName: 'My Business',
        ownerName: 'Owner Name',
        phone: '03001234567'
    }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadData();
    setDefaultDate();
    loadSettings();
    setupOnlineOfflineHandling();
});

function initializeApp() {
    console.log('Initializing application...');
    // Set today's date in report
    const today = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.getElementById('reportDate').textContent = today;
    
    const monthName = new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    document.getElementById('reportMonth').textContent = monthName;
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('elecDate').value = today;
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavigation(e.currentTarget.dataset.section);
        });
    });

    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            handleNavigation(e.currentTarget.dataset.section);
        });
    });

    // Form submissions
    document.getElementById('chakiForm').addEventListener('submit', handleChakiBagSubmit);
    document.getElementById('electricityForm').addEventListener('submit', handleElectricitySubmit);
    document.getElementById('saleForm').addEventListener('submit', handleSaleSubmit);
    document.getElementById('agencyForm').addEventListener('submit', handleAgencySubmit);
    document.getElementById('salesmanForm').addEventListener('submit', handleSalesmanSubmit);
    
    // Settings forms
    document.getElementById('settingsChakiForm').addEventListener('submit', handleSettingsChaki);
    document.getElementById('settingsCigForm').addEventListener('submit', handleSettingsCig);
    document.getElementById('settingsBusinessForm').addEventListener('submit', handleSettingsBusiness);

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });

    // Data management buttons
    document.getElementById('exportDataBtn').addEventListener('click', exportToExcel);
    document.getElementById('syncSheetsBtn').addEventListener('click', syncWithSheets);
    document.getElementById('backupDataBtn').addEventListener('click', backupData);

    // Modal
    document.getElementById('confirmYes').addEventListener('click', () => {
        document.getElementById('confirmModal').classList.remove('active');
    });
    document.getElementById('confirmNo').addEventListener('click', () => {
        document.getElementById('confirmModal').classList.remove('active');
    });

    // Electricity calculation
    document.getElementById('elecMorning').addEventListener('change', calculateElectricity);
    document.getElementById('elecNight').addEventListener('change', calculateElectricity);

    // Sale calculation
    document.getElementById('saleSold').addEventListener('change', calculateSaleProfit);
}

// ============================================
// NAVIGATION & SECTIONS
// ============================================

function handleNavigation(section) {
    if (!section) {
        console.error('Navigation section is undefined');
        return;
    }

    // Hide all sections
    document.querySelectorAll('.section').forEach(sec => {
        sec.classList.remove('active');
    });

    // Remove active from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const sectionElement = document.getElementById(section + '-section');
    if (sectionElement) {
        sectionElement.classList.add('active');
    } else {
        console.error('Section not found:', section);
        return;
    }

    // Mark nav button as active
    const navBtn = document.querySelector(`.nav-btn[data-section="${section}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    // Mark sidebar link as active
    const sidebarLink = document.querySelector(`.sidebar-link[data-section="${section}"]`);
    if (sidebarLink) {
        sidebarLink.classList.add('active');
    }

    AppState.currentSection = section;

    // Refresh data for the section
    if (section === 'chaki') {
        loadChakiBags();
    } else if (section === 'cigarettes') {
        loadSales();
    } else if (section === 'reports') {
        updateReports();
    }
}

function handleTabChange(e) {
    const tabName = e.currentTarget.dataset.tab;
    
    if (!tabName) {
        console.error('Tab name is undefined');
        return;
    }
    
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Add active to clicked tab
    e.currentTarget.classList.add('active');
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.add('active');
    }

    AppState.currentTab = tabName;

    // Load data for tab
    if (tabName === 'sales') loadSales();
    else if (tabName === 'inventory') loadInventory();
    else if (tabName === 'salesman') loadSalesmen();
    else if (tabName === 'routes') loadRoutes();
}

// ============================================
// CHAKI MANAGEMENT
// ============================================

async function handleChakiBagSubmit(e) {
    e.preventDefault();

    const bag = {
        date: new Date().toISOString().split('T')[0],
        customer: document.getElementById('chakiCustomer').value,
        originalWeight: parseFloat(document.getElementById('chakiOriginalWeight').value),
        finalWeight: parseFloat(document.getElementById('chakiFinalWeight').value),
        cleaning: document.getElementById('chakiCleaning').value,
        cleaningCharge: parseFloat(document.getElementById('chakiCleaningCharge').value),
        worker: document.getElementById('chakiWorker').value,
        status: document.getElementById('chakiStatus').value,
        id: Date.now().toString()
    };

    // Calculate metrics
    bag.weightLoss = bag.originalWeight - bag.finalWeight;
    bag.workerCommission = (bag.finalWeight / 40) * AppState.settings.workerCommission;
    bag.electricityAllocated = 50; // Will be calculated from daily average
    bag.profit = (bag.finalWeight * 20) - bag.cleaningCharge - bag.workerCommission;

    AppState.chakiBags.push(bag);

    if (isFirebaseReady) {
        try {
            await db.ref('chakiBags/' + bag.id).set(bag);
            showToast('Bag recorded successfully!', 'success');
        } catch (error) {
            showToast('Error saving to Firebase: ' + error.message, 'error');
            console.error('Firebase error:', error);
        }
    } else {
        // Save to localStorage for offline
        localStorage.setItem('chakiBags', JSON.stringify(AppState.chakiBags));
        showToast('Bag saved locally (offline mode)', 'success');
    }

    document.getElementById('chakiForm').reset();
    updateDashboard();
    loadChakiBags();
}

async function handleElectricitySubmit(e) {
    e.preventDefault();

    const reading = {
        date: document.getElementById('elecDate').value,
        morning: parseFloat(document.getElementById('elecMorning').value),
        night: parseFloat(document.getElementById('elecNight').value || 0),
        id: Date.now().toString()
    };

    reading.units = reading.night - reading.morning;
    reading.cost = reading.units * AppState.settings.elecRate;

    if (isFirebaseReady) {
        try {
            await db.ref('electricity/' + reading.id).set(reading);
            showToast('Electricity reading saved!', 'success');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    } else {
        localStorage.setItem('electricity', JSON.stringify(reading));
        showToast('Reading saved locally (offline mode)', 'success');
    }

    document.getElementById('electricityForm').reset();
    setDefaultDate();
}

function loadChakiBags() {
    if (isFirebaseReady) {
        db.ref('chakiBags').orderByChild('date').limitToLast(10).once('value', snapshot => {
            const bags = [];
            snapshot.forEach(child => {
                bags.unshift(child.val());
            });
            renderChakiBagsTable(bags);
        });
    } else {
        const bags = JSON.parse(localStorage.getItem('chakiBags') || '[]');
        renderChakiBagsTable(bags.slice(-10).reverse());
    }
}

function renderChakiBagsTable(bags) {
    const table = document.getElementById('chakiBagsTable');
    
    if (!bags || bags.length === 0) {
        table.innerHTML = '<tr><td colspan="6">No bags recorded yet</td></tr>';
        return;
    }

    table.innerHTML = bags.map(bag => `
        <tr>
            <td>${bag.date}</td>
            <td>${bag.customer}</td>
            <td>${bag.finalWeight} kg</td>
            <td>${bag.worker}</td>
            <td><span class="status-badge ${bag.status.toLowerCase()}">${bag.status}</span></td>
            <td>Rs ${(bag.profit || 0).toFixed(0)}</td>
        </tr>
    `).join('');
}

// ============================================
// CIGARETTE SALES
// ============================================

async function handleSaleSubmit(e) {
    e.preventDefault();

    const sale = {
        date: new Date().toISOString().split('T')[0],
        route: document.getElementById('saleRoute').value,
        salesman: document.getElementById('saleSalesman').value,
        opening: parseFloat(document.getElementById('saleOpening').value),
        sold: parseFloat(document.getElementById('saleSold').value),
        cash: parseFloat(document.getElementById('saleCash').value),
        id: Date.now().toString()
    };

    sale.closing = sale.opening - sale.sold;
    sale.revenue = sale.sold * AppState.settings.retailPrice;
    sale.cost = sale.sold * AppState.settings.agencyPrice;
    sale.profit = sale.revenue - sale.cost;

    AppState.cigarSales.push(sale);

    if (isFirebaseReady) {
        try {
            await db.ref('cigarSales/' + sale.id).set(sale);
            showToast('Sale recorded successfully!', 'success');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    } else {
        localStorage.setItem('cigarSales', JSON.stringify(AppState.cigarSales));
        showToast('Sale saved locally (offline mode)', 'success');
    }

    document.getElementById('saleForm').reset();
    updateDashboard();
    loadSales();
}

async function handleAgencySubmit(e) {
    e.preventDefault();

    const agency = {
        date: new Date().toISOString().split('T')[0],
        agencyName: document.getElementById('agencyName').value,
        invoice: document.getElementById('agencyInvoice').value,
        quantity: parseFloat(document.getElementById('agencyQty').value),
        price: parseFloat(document.getElementById('agencyPrice').value),
        paymentStatus: document.getElementById('agencyPayment').value,
        id: Date.now().toString()
    };

    agency.totalCost = agency.quantity * agency.price;

    if (isFirebaseReady) {
        try {
            await db.ref('agency/' + agency.id).set(agency);
            showToast('Purchase recorded!', 'success');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }

    document.getElementById('agencyForm').reset();
    loadInventory();
}

async function handleSalesmanSubmit(e) {
    e.preventDefault();

    const salesman = {
        name: document.getElementById('salesmanName').value,
        commission: parseFloat(document.getElementById('salesmanCommission').value),
        status: document.getElementById('salesmanStatus').value,
        id: Date.now().toString()
    };

    if (isFirebaseReady) {
        try {
            await db.ref('salesmen/' + salesman.id).set(salesman);
            showToast('Salesman added!', 'success');
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        }
    }

    document.getElementById('salesmanForm').reset();
    loadSalesmen();
}

function loadSales() {
    if (isFirebaseReady) {
        db.ref('cigarSales').orderByChild('date').limitToLast(20).once('value', snapshot => {
            const sales = [];
            snapshot.forEach(child => {
                sales.unshift(child.val());
            });
            renderSalesTable(sales);
        });
    } else {
        const sales = JSON.parse(localStorage.getItem('cigarSales') || '[]');
        renderSalesTable(sales.slice(-20).reverse());
    }
}

function renderSalesTable(sales) {
    const table = document.getElementById('salesTable');
    
    if (!sales || sales.length === 0) {
        table.innerHTML = '<tr><td colspan="6">No sales recorded yet</td></tr>';
        return;
    }

    table.innerHTML = sales.map(sale => `
        <tr>
            <td>${sale.date}</td>
            <td>${sale.route}</td>
            <td>${sale.salesman}</td>
            <td>${sale.sold}</td>
            <td>Rs ${(sale.revenue || 0).toFixed(0)}</td>
            <td>Rs ${(sale.profit || 0).toFixed(0)}</td>
        </tr>
    `).join('');
}

function loadInventory() {
    if (isFirebaseReady) {
        db.ref('agency').once('value', snapshot => {
            const inventory = [];
            snapshot.forEach(child => {
                inventory.push(child.val());
            });
            renderInventoryTable(inventory);
        });
    } else {
        showToast('No inventory data - offline mode', 'info');
    }
}

function renderInventoryTable(inventory) {
    const table = document.getElementById('inventoryTable');
    
    if (!inventory || inventory.length === 0) {
        table.innerHTML = '<tr><td colspan="6">No inventory records</td></tr>';
        return;
    }

    table.innerHTML = inventory.map(item => `
        <tr>
            <td>${item.agencyName}</td>
            <td>${item.invoice}</td>
            <td>${item.date}</td>
            <td>${item.quantity}</td>
            <td>Rs ${(item.totalCost || 0).toFixed(0)}</td>
            <td>${item.paymentStatus}</td>
        </tr>
    `).join('');
}

function loadSalesmen() {
    if (isFirebaseReady) {
        db.ref('salesmen').once('value', snapshot => {
            const salesmen = [];
            snapshot.forEach(child => {
                salesmen.push(child.val());
            });
            renderSalesmenTable(salesmen);
        });
    }
}

function renderSalesmenTable(salesmen) {
    const table = document.getElementById('salesmanTable');
    
    if (!salesmen || salesmen.length === 0) {
        table.innerHTML = '<tr><td colspan="5">No salesmen added yet</td></tr>';
        return;
    }

    table.innerHTML = salesmen.map(salesman => `
        <tr>
            <td>${salesman.name}</td>
            <td>Rs ${salesman.commission} per outer</td>
            <td>0</td>
            <td>Rs 0</td>
            <td>${salesman.status}</td>
        </tr>
    `).join('');
}

function loadRoutes() {
    if (isFirebaseReady) {
        db.ref('cigarSales').once('value', snapshot => {
            const routeMap = {};
            snapshot.forEach(child => {
                const sale = child.val();
                if (!routeMap[sale.route]) {
                    routeMap[sale.route] = { sales: [], profit: 0 };
                }
                routeMap[sale.route].sales.push(sale);
                routeMap[sale.route].profit += sale.profit || 0;
            });

            const routes = Object.entries(routeMap).map(([name, data], index) => ({
                name,
                sales: data.sales.length,
                profit: data.profit,
                rank: index + 1
            })).sort((a, b) => b.profit - a.profit);

            renderRoutesTable(routes);
        });
    }
}

function renderRoutesTable(routes) {
    const table = document.getElementById('routesTable');
    
    if (!routes || routes.length === 0) {
        table.innerHTML = '<tr><td colspan="4">No route data</td></tr>';
        return;
    }

    table.innerHTML = routes.map((route, index) => `
        <tr>
            <td>${route.name}</td>
            <td>${route.sales}</td>
            <td>Rs ${route.profit.toFixed(0)}</td>
            <td>#${index + 1}</td>
        </tr>
    `).join('');
}

// ============================================
// CALCULATIONS
// ============================================

function calculateElectricity() {
    const morning = parseFloat(document.getElementById('elecMorning').value) || 0;
    const night = parseFloat(document.getElementById('elecNight').value) || 0;
    
    const units = night - morning;
    const cost = units * AppState.settings.elecRate;
    
    document.getElementById('elecUnits').textContent = units;
    document.getElementById('elecCost').textContent = cost.toFixed(0);
}

function calculateSaleProfit() {
    const sold = parseFloat(document.getElementById('saleSold').value) || 0;
    const revenue = sold * AppState.settings.retailPrice;
    const cost = sold * AppState.settings.agencyPrice;
    const profit = revenue - cost;
    
    document.getElementById('saleProfit').textContent = 'Rs ' + profit.toFixed(0);
}

// ============================================
// DASHBOARD & REPORTS
// ============================================

function updateDashboard() {
    // Daily summary
    const today = new Date().toISOString().split('T')[0];
    const todayBags = AppState.chakiBags.filter(b => b.date === today);
    const todaySales = AppState.cigarSales.filter(s => s.date === today);

    document.getElementById('dailyBags').textContent = todayBags.length;
    document.getElementById('dailyWeight').textContent = todayBags.reduce((sum, b) => sum + b.finalWeight, 0).toFixed(0);
    document.getElementById('dailyRoutes').textContent = [...new Set(todaySales.map(s => s.route))].length;
    document.getElementById('dailyOuters').textContent = todaySales.reduce((sum, s) => sum + s.sold, 0);
    document.getElementById('dailyRevenue').textContent = todaySales.reduce((sum, s) => sum + s.revenue, 0).toFixed(0);

    const todayChakiProfit = todayBags.reduce((sum, b) => sum + (b.profit || 0), 0);
    const todayCigProfit = todaySales.reduce((sum, s) => sum + (s.profit || 0), 0);

    document.getElementById('todayChakiProfit').textContent = 'Rs ' + todayChakiProfit.toFixed(0);
    document.getElementById('todayCigProfit').textContent = 'Rs ' + todayCigProfit.toFixed(0);
    document.getElementById('todayTotalProfit').textContent = 'Rs ' + (todayChakiProfit + todayCigProfit).toFixed(0);

    // Monthly summary
    const monthProfit = calculateMonthlyProfit();
    document.getElementById('monthChakiProfit').textContent = 'Rs ' + monthProfit.chaki.toFixed(0);
    document.getElementById('monthCigProfit').textContent = 'Rs ' + monthProfit.cig.toFixed(0);
    document.getElementById('monthTotalProfit').textContent = 'Rs ' + (monthProfit.chaki + monthProfit.cig).toFixed(0);
}

function calculateMonthlyProfit() {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const chakiBags = AppState.chakiBags.filter(b => {
        const bagDate = new Date(b.date);
        return bagDate.getMonth() === month && bagDate.getFullYear() === year;
    });

    const cigarSales = AppState.cigarSales.filter(s => {
        const saleDate = new Date(s.date);
        return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });

    const chakiProfit = chakiBags.reduce((sum, b) => sum + (b.profit || 0), 0);
    const cigProfit = cigarSales.reduce((sum, s) => sum + (s.profit || 0), 0);

    return { chaki: chakiProfit, cig: cigProfit };
}

function updateReports() {
    const today = new Date().toISOString().split('T')[0];
    const todayBags = AppState.chakiBags.filter(b => b.date === today);
    const todaySales = AppState.cigarSales.filter(s => s.date === today);

    document.getElementById('reportBags').textContent = todayBags.length;
    document.getElementById('reportRoutes').textContent = [...new Set(todaySales.map(s => s.route))].length;

    const todayProfit = todayBags.reduce((sum, b) => sum + (b.profit || 0), 0) + 
                        todaySales.reduce((sum, s) => sum + (s.profit || 0), 0);
    document.getElementById('reportDailyProfit').textContent = 'Rs ' + todayProfit.toFixed(0);

    // Week calculation
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekBags = AppState.chakiBags.filter(b => new Date(b.date) >= weekAgo);
    const weekSales = AppState.cigarSales.filter(s => new Date(s.date) >= weekAgo);

    document.getElementById('weekBags').textContent = weekBags.length;
    document.getElementById('weekRoutes').textContent = [...new Set(weekSales.map(s => s.route))].length;
    document.getElementById('weekWeight').textContent = weekBags.reduce((sum, b) => sum + b.finalWeight, 0).toFixed(0) + ' kg';

    const weekProfit = weekBags.reduce((sum, b) => sum + (b.profit || 0), 0) + 
                      weekSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    document.getElementById('weekProfit').textContent = 'Rs ' + weekProfit.toFixed(0);

    // Month calculation
    const monthProfit = calculateMonthlyProfit();
    const monthBags = AppState.chakiBags.filter(b => {
        const bagDate = new Date(b.date);
        const now = new Date();
        return bagDate.getMonth() === now.getMonth() && bagDate.getFullYear() === now.getFullYear();
    });

    document.getElementById('monthBags').textContent = monthBags.length;
    document.getElementById('monthWeight').textContent = monthBags.reduce((sum, b) => sum + b.finalWeight, 0).toFixed(0) + ' kg';
    document.getElementById('monthlyProfit').textContent = 'Rs ' + (monthProfit.chaki + monthProfit.cig).toFixed(0);
}

// ============================================
// SETTINGS
// ============================================

function loadSettings() {
    if (isFirebaseReady) {
        db.ref('settings').once('value', snapshot => {
            if (snapshot.val()) {
                AppState.settings = { ...AppState.settings, ...snapshot.val() };
            }
            populateSettingsForm();
        });
    } else {
        const saved = localStorage.getItem('settings');
        if (saved) {
            AppState.settings = { ...AppState.settings, ...JSON.parse(saved) };
        }
        populateSettingsForm();
    }
}

function populateSettingsForm() {
    document.getElementById('setWorkerCommission').value = AppState.settings.workerCommission;
    document.getElementById('setElecRate').value = AppState.settings.elecRate;
    document.getElementById('setCleaningCost').value = AppState.settings.cleaningCost;
    document.getElementById('setAgencyPrice').value = AppState.settings.agencyPrice;
    document.getElementById('setRetailPrice').value = AppState.settings.retailPrice;
    document.getElementById('setWholeSalePrice').value = AppState.settings.wholesalePrice;
    document.getElementById('setBusinessName').value = AppState.settings.businessName;
    document.getElementById('setOwnerName').value = AppState.settings.ownerName;
    document.getElementById('setPhone').value = AppState.settings.phone;
}

async function handleSettingsChaki(e) {
    e.preventDefault();
    AppState.settings.workerCommission = parseFloat(document.getElementById('setWorkerCommission').value);
    AppState.settings.elecRate = parseFloat(document.getElementById('setElecRate').value);
    AppState.settings.cleaningCost = parseFloat(document.getElementById('setCleaningCost').value);

    if (isFirebaseReady) {
        try {
            await db.ref('settings').update({
                workerCommission: AppState.settings.workerCommission,
                elecRate: AppState.settings.elecRate,
                cleaningCost: AppState.settings.cleaningCost
            });
        } catch (error) {
            console.error(error);
        }
    } else {
        localStorage.setItem('settings', JSON.stringify(AppState.settings));
    }

    showToast('Chaki settings saved!', 'success');
}

async function handleSettingsCig(e) {
    e.preventDefault();
    AppState.settings.agencyPrice = parseFloat(document.getElementById('setAgencyPrice').value);
    AppState.settings.retailPrice = parseFloat(document.getElementById('setRetailPrice').value);
    AppState.settings.wholesalePrice = parseFloat(document.getElementById('setWholeSalePrice').value);

    if (isFirebaseReady) {
        try {
            await db.ref('settings').update({
                agencyPrice: AppState.settings.agencyPrice,
                retailPrice: AppState.settings.retailPrice,
                wholesalePrice: AppState.settings.wholesalePrice
            });
        } catch (error) {
            console.error(error);
        }
    } else {
        localStorage.setItem('settings', JSON.stringify(AppState.settings));
    }

    showToast('Cigarette settings saved!', 'success');
}

async function handleSettingsBusiness(e) {
    e.preventDefault();
    AppState.settings.businessName = document.getElementById('setBusinessName').value;
    AppState.settings.ownerName = document.getElementById('setOwnerName').value;
    AppState.settings.phone = document.getElementById('setPhone').value;

    if (isFirebaseReady) {
        try {
            await db.ref('settings').update(AppState.settings);
        } catch (error) {
            console.error(error);
        }
    } else {
        localStorage.setItem('settings', JSON.stringify(AppState.settings));
    }

    showToast('Business info saved!', 'success');
}

// ============================================
// DATA EXPORT & SYNC
// ============================================

function exportToExcel() {
    const data = {
        settings: AppState.settings,
        chakiBags: AppState.chakiBags,
        cigarSales: AppState.cigarSales
    };

    const csv = convertToCSV(data);
    downloadCSV(csv, 'business_data.csv');
    showToast('Data exported as CSV!', 'success');
}

function convertToCSV(data) {
    let csv = 'Business Management Data Export\n\n';
    csv += 'CHAKI BAGS\n';
    csv += 'Date,Customer,Original Weight,Final Weight,Cleaning,Charge,Worker,Profit\n';
    
    data.chakiBags.forEach(bag => {
        csv += `${bag.date},${bag.customer},${bag.originalWeight},${bag.finalWeight},${bag.cleaning},${bag.cleaningCharge},${bag.worker},${bag.profit || 0}\n`;
    });

    csv += '\nCIGARETTE SALES\n';
    csv += 'Date,Route,Salesman,Opening,Sold,Closing,Revenue,Profit\n';
    
    data.cigarSales.forEach(sale => {
        csv += `${sale.date},${sale.route},${sale.salesman},${sale.opening},${sale.sold},${sale.closing},${sale.revenue || 0},${sale.profit || 0}\n`;
    });

    return csv;
}

function downloadCSV(csv, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

async function syncWithSheets() {
    showToast('Syncing with Google Sheets...', 'info');
    
    // This would require Google Sheets API integration
    // For now, we'll just show a message
    setTimeout(() => {
        showToast('Sync feature requires configuration. See setup guide.', 'warning');
    }, 1000);
}

function backupData() {
    const backup = {
        timestamp: new Date().toISOString(),
        data: {
            chakiBags: AppState.chakiBags,
            cigarSales: AppState.cigarSales,
            settings: AppState.settings
        }
    };

    const json = JSON.stringify(backup, null, 2);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(json));
    element.setAttribute('download', 'backup_' + new Date().getTime() + '.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showToast('Backup created!', 'success');
}

// ============================================
// NOTIFICATIONS & UI
// ============================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show', type);

    setTimeout(() => {
        toast.classList.remove('show', type);
    }, 3000);
}

// ============================================
// ONLINE/OFFLINE HANDLING
// ============================================

function setupOnlineOfflineHandling() {
    window.addEventListener('online', () => {
        updateSyncStatus(true);
        showToast('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
        updateSyncStatus(false);
        showToast('You are offline. Changes will sync when online.', 'warning');
    });

    updateSyncStatus(navigator.onLine);
}

function updateSyncStatus(isOnline) {
    const status = document.getElementById('syncStatus');
    if (isOnline) {
        status.textContent = '● Online';
        status.classList.add('online');
    } else {
        status.textContent = '● Offline';
        status.classList.remove('online');
    }
}

// ============================================
// DATA LOADING
// ============================================

function loadData() {
    if (isFirebaseReady) {
        // Load from Firebase
        loadDataFromFirebase();
    } else {
        // Load from localStorage
        loadDataFromLocalStorage();
    }

    updateDashboard();
}

function loadDataFromFirebase() {
    db.ref('chakiBags').once('value', snapshot => {
        AppState.chakiBags = [];
        snapshot.forEach(child => {
            AppState.chakiBags.push(child.val());
        });
    });

    db.ref('cigarSales').once('value', snapshot => {
        AppState.cigarSales = [];
        snapshot.forEach(child => {
            AppState.cigarSales.push(child.val());
        });
    });
}

function loadDataFromLocalStorage() {
    const bags = localStorage.getItem('chakiBags');
    const sales = localStorage.getItem('cigarSales');

    if (bags) AppState.chakiBags = JSON.parse(bags);
    if (sales) AppState.cigarSales = JSON.parse(sales);
}

// Initialize on load
console.log('App script loaded');
