let currentTest = null;
let currentQuestions = null;

// 用于存储历史记录的键名
const HISTORY_KEY = 'testHistory';

// 添加管理员模式状态
let isAdminMode = false;

// 添加键盘事件监听
document.addEventListener('keydown', function(event) {
    // 检测 Ctrl + Alt + S
    if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault(); // 阻止默认行为
        toggleAdminMode();
    }
});

// 切换管理员模式
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    if (isAdminMode) {
        showAdminPanel();
        // 显示提示信息
        showNotification('已进入管理员模式');
    } else {
        hideAdminPanel();
        showNotification('已退出管理员模式');
    }
}

// 显示管理员面板
function showAdminPanel() {
    // 隐藏其他内容
    document.getElementById('test-list').style.display = 'none';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('history-container').style.display = 'none';
    document.getElementById('about-container').style.display = 'none';

    // 创建管理员面板
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    adminPanel.className = 'admin-panel';

    // 获取所有用户数据
    const allHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    // 统计数据
    const stats = calculateStats(allHistory);

    adminPanel.innerHTML = `
        <div class="admin-header">
            <h2>管理员面板</h2>
            <div class="admin-controls">
                <span class="admin-badge">管理员模式</span>
                <button onclick="toggleAdminMode()" class="exit-admin-btn">
                    退出管理员模式
                </button>
            </div>
        </div>
        
        <div class="stats-container">
            <div class="stat-card">
                <h3>总测评次数</h3>
                <p>${stats.totalTests}</p>
            </div>
            <div class="stat-card">
                <h3>今日测评</h3>
                <p>${stats.todayTests}</p>
            </div>
            <div class="stat-card">
                <h3>平均得分率</h3>
                <p>${stats.averageScore.toFixed(1)}%</p>
            </div>
        </div>

        <div class="chart-container">
            <h3>整体趋势分析</h3>
            <canvas id="adminTrendChart"></canvas>
        </div>

        <div class="data-table-container">
            <h3>详细测评记录</h3>
            <div class="table-actions">
                <input type="text" id="searchInput" placeholder="搜索..." onkeyup="filterResults()">
                <button onclick="exportAllData()">导出所有数据</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>日期</th>
                        <th>总体状况</th>
                        <th>焦虑水平</th>
                        <th>抑郁程度</th>
                        <th>压力状况</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${generateTableRows(allHistory)}
                </tbody>
            </table>
        </div>
    `;

    document.querySelector('main').appendChild(adminPanel);
    drawAdminTrendChart(allHistory);
}

// 生成表格行
function generateTableRows(history) {
    return history.map((record, index) => `
        <tr>
            <td>${formatDate(record.date)}</td>
            <td>${record.overallStatus}</td>
            <td>${record.results?.anxiety.level || '-'}</td>
            <td>${record.results?.depression.level || '-'}</td>
            <td>${record.results?.stress.level || '-'}</td>
            <td>
                <button onclick="viewDetailedRecord(${index})" class="small-btn">详情</button>
                <button onclick="deleteRecord(${index})" class="small-btn danger">删除</button>
            </td>
        </tr>
    `).join('');
}

// 计算统计数据
function calculateStats(history) {
    const today = new Date().toDateString();
    const todayTests = history.filter(record => 
        new Date(record.date).toDateString() === today
    ).length;

    let totalScore = 0;
    let totalPossible = 0;
    history.forEach(record => {
        if (record.results) {
            Object.values(record.results).forEach(result => {
                totalScore += result.score;
                totalPossible += result.maxScore;
            });
        }
    });

    return {
        totalTests: history.length,
        todayTests,
        averageScore: totalPossible ? (totalScore / totalPossible) * 100 : 0
    };
}

// 绘制管理员趋势图
function drawAdminTrendChart(history) {
    const ctx = document.getElementById('adminTrendChart');
    const chartData = prepareAdminChartData(history);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: '焦虑水平',
                    data: chartData.anxiety,
                    borderColor: '#FF6384',
                    tension: 0.4
                },
                {
                    label: '抑郁程度',
                    data: chartData.depression,
                    borderColor: '#36A2EB',
                    tension: 0.4
                },
                {
                    label: '压力状况',
                    data: chartData.stress,
                    borderColor: '#FFCE56',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// 准备管理员图表数据
function prepareAdminChartData(history) {
    const sortedHistory = [...history].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
        labels: sortedHistory.map(record => formatDate(record.date)),
        anxiety: sortedHistory.map(record => 
            record.results?.anxiety.score / record.results?.anxiety.maxScore * 100 || 0
        ),
        depression: sortedHistory.map(record => 
            record.results?.depression.score / record.results?.depression.maxScore * 100 || 0
        ),
        stress: sortedHistory.map(record => 
            record.results?.stress.score / record.results?.stress.maxScore * 100 || 0
        )
    };
}

// 查看详细记录
function viewDetailedRecord(index) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const record = history[index];
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-btn" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h3>详细记录</h3>
            <div class="record-details">
                <p>测评日期：${formatDate(record.date)}</p>
                <p>总体状况：${record.overallStatus}</p>
                <div class="detailed-scores">
                    <h4>详细得分</h4>
                    <p>焦虑：${record.results.anxiety.score}/${record.results.anxiety.maxScore} (${record.results.anxiety.level})</p>
                    <p>抑郁：${record.results.depression.score}/${record.results.depression.maxScore} (${record.results.depression.level})</p>
                    <p>压力：${record.results.stress.score}/${record.results.stress.maxScore} (${record.results.stress.level})</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// 导出所有数据
function exportAllData() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const csv = [
        '日期,总体状况,焦虑得分,焦虑水平,抑郁得分,抑郁水平,压力得分,压力水平'
    ];
    
    history.forEach(record => {
        csv.push(`${formatDate(record.date)},${record.overallStatus},` +
            `${record.results.anxiety.score}/${record.results.anxiety.maxScore},${record.results.anxiety.level},` +
            `${record.results.depression.score}/${record.results.depression.maxScore},${record.results.depression.level},` +
            `${record.results.stress.score}/${record.results.stress.maxScore},${record.results.stress.level}`
        );
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '心理测评数据导出.csv';
    link.click();
}

// 隐藏管理员面板
function hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.remove();
    }
    showHome();
}

// 搜索过滤功能
function filterResults() {
    const input = document.getElementById('searchInput');
    const filter = input.value.toLowerCase();
    const tbody = document.querySelector('.data-table tbody');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? '' : 'none';
    }
}

function startTest(testId) {
    if (!tests[testId]) {
        alert('测评量表未找到！');
        return;
    }

    currentTest = testId;
    const test = tests[testId];
    
    // 随机选择题目
    currentQuestions = getRandomQuestions(test.questions, test.questionsPerTest);
    
    document.getElementById('test-list').style.display = 'none';
    document.getElementById('test-container').style.display = 'block';
    document.getElementById('test-title').textContent = test.title;
    
    renderQuestions(currentQuestions);
}

function getRandomQuestions(questions, count) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function renderQuestions(questions) {
    const container = document.getElementById('question-container');
    container.innerHTML = '';
    
    questions.forEach((q, index) => {
        const div = document.createElement('div');
        div.className = 'question';
        div.innerHTML = `
            <p>${index + 1}. ${q.question}</p>
            <div class="options">
                ${q.options.map((opt, i) => `
                    <label>
                        <input type="radio" name="q${index}" value="${i}">
                        ${opt}
                    </label>
                `).join('')}
            </div>
        `;
        container.appendChild(div);
    });
}

function submitTest() {
    if (!currentTest || !tests[currentTest]) {
        alert('测评未正确加载，请刷新页面重试！');
        return;
    }

    const test = tests[currentTest];
    let unanswered = false;
    
    // 按类型统计分数
    const scores = {
        anxiety: 0,
        depression: 0,
        stress: 0
    };
    
    test.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        if (!selected) {
            unanswered = true;
            return;
        }
        scores[q.type] += q.scores[parseInt(selected.value)];
    });
    
    if (unanswered) {
        alert('请回答所有问题！');
        return;
    }
    
    const results = test.getResult(scores);
    showResult(results);
}

function showResult(results) {
    const container = document.getElementById('test-container');
    const overallStatus = getOverallStatus(results);
    const date = new Date().toLocaleString();
    
    container.innerHTML = `
        <div id="result-content">
            <h2>心理健康评测报告</h2>
            <div class="report-meta">
                <p>测评时间：${date}</p>
                <p>报告编号：${generateReportId()}</p>
            </div>
            <div class="result">
                <div class="result-summary">
                    <h3>总体评估：${overallStatus}</h3>
                </div>
                <div class="result-details">
                    <div class="result-item">
                        <h4>焦虑水平</h4>
                        <p>得分：${results.anxiety.score}/${results.anxiety.maxScore}</p>
                        <p>评估：${results.anxiety.level}</p>
                    </div>
                    <div class="result-item">
                        <h4>抑郁程度</h4>
                        <p>得分：${results.depression.score}/${results.depression.maxScore}</p>
                        <p>评估：${results.depression.level}</p>
                    </div>
                    <div class="result-item">
                        <h4>压力状况</h4>
                        <p>得分：${results.stress.score}/${results.stress.maxScore}</p>
                        <p>评估：${results.stress.level}</p>
                    </div>
                </div>
                <div class="result-suggestions">
                    <h4>建议与提醒</h4>
                    <p>${getSuggestions(results)}</p>
                </div>
            </div>
            <div class="result-actions">
                <button onclick="printResult()">打印报告</button>
                <button onclick="exportToPDF()">导出PDF</button>
                <button onclick="exportToImage()">导出图片</button>
                <button onclick="viewHistory()">查看历史记录</button>
                <button onclick="location.reload()">返回首页</button>
            </div>
        </div>
    `;

    // 保存测试结果
    saveTestHistory('comprehensive', results);
}

function getOverallStatus(results) {
    const levels = {
        "正常": 0,
        "轻度": 1,
        "中度": 2,
        "重度": 3
    };
    
    const maxLevel = Math.max(
        levels[results.anxiety.level],
        levels[results.depression.level],
        levels[results.stress.level]
    );
    
    switch(maxLevel) {
        case 0: return "心理状态良好";
        case 1: return "需要适当关注";
        case 2: return "建议寻求帮助";
        case 3: return "强烈建议专业干预";
    }
}

function saveTestHistory(testId, results) {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    history.push({
        testId,
        date: new Date().toISOString(),
        results: results,
        overallStatus: getOverallStatus(results)
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function viewHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    
    document.getElementById('test-list').style.display = 'none';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('history-container').style.display = 'block';

    if (history.length === 0) {
        document.getElementById('history-container').innerHTML = `
            <h2>历史记录</h2>
            <p>暂无测评记录</p>
            <button onclick="showHome()">返回首页</button>
        `;
        return;
    }

    // 准备图表数据
    const chartData = prepareChartData(history);
    
    // 更新历史记录列表
    const sortedHistory = [...history].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    document.getElementById('history-container').innerHTML = `
        <h2>测评历史记录</h2>
        <div class="chart-container" style="position: relative; height:400px; width:100%; margin: 20px 0;">
            <canvas id="trendChart"></canvas>
        </div>
        <div class="history-actions">
            <button onclick="exportHistory()">导出历史记录</button>
            <button onclick="clearHistory()" class="danger-btn">清空历史记录</button>
            <button onclick="showHome()">返回首页</button>
        </div>
        <div id="history-list">
            ${sortedHistory.map((record, index) => `
                <div class="history-item">
                    <div class="history-item-header">
                        <span>测试日期：${formatDate(record.date)}</span>
                        <button class="delete-btn" onclick="deleteRecord(${index})">
                            删除
                        </button>
                    </div>
                    <p>总体状况：${record.overallStatus || '未知'}</p>
                    ${record.results ? `
                        <div class="result-details">
                            <p>焦虑：${record.results.anxiety.score}/${record.results.anxiety.maxScore} (${record.results.anxiety.level})</p>
                            <p>抑郁：${record.results.depression.score}/${record.results.depression.maxScore} (${record.results.depression.level})</p>
                            <p>压力：${record.results.stress.score}/${record.results.stress.maxScore} (${record.results.stress.level})</p>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;

    // 绘制趋势图
    drawTrendChart(chartData);
}

function prepareChartData(history) {
    const groupedData = {
        anxiety: { labels: [], data: [], rawData: [] },
        depression: { labels: [], data: [], rawData: [] },
        stress: { labels: [], data: [], rawData: [] }
    };
    
    // 按日期排序
    const sortedHistory = [...history].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    sortedHistory.forEach(record => {
        if (!record.results) return;
        
        const date = new Date(record.date);
        const dateLabel = `${date.getMonth() + 1}/${date.getDate()}`;

        // 处理每种类型的数据
        ['anxiety', 'depression', 'stress'].forEach(type => {
            if (record.results[type]) {
                groupedData[type].labels.push(dateLabel);
                groupedData[type].data.push((record.results[type].score / record.results[type].maxScore) * 100);
                groupedData[type].rawData.push({
                    score: record.results[type].score,
                    maxScore: record.results[type].maxScore
                });
            }
        });
    });

    return groupedData;
}

function drawTrendChart(chartData) {
    const ctx = document.getElementById('trendChart');
    
    if (window.myChart instanceof Chart) {
        window.myChart.destroy();
    }

    const datasets = [
        {
            label: '焦虑水平',
            data: chartData.anxiety.data,
            borderColor: '#FF6384',
            fill: false,
            tension: 0.4,
            rawData: chartData.anxiety.rawData
        },
        {
            label: '抑郁程度',
            data: chartData.depression.data,
            borderColor: '#36A2EB',
            fill: false,
            tension: 0.4,
            rawData: chartData.depression.rawData
        },
        {
            label: '压力状况',
            data: chartData.stress.data,
            borderColor: '#FFCE56',
            fill: false,
            tension: 0.4,
            rawData: chartData.stress.rawData
        }
    ];

    window.myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.anxiety.labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetIndex = context.datasetIndex;
                            const index = context.dataIndex;
                            const rawData = datasets[datasetIndex].rawData[index];
                            return `${context.dataset.label}: ${rawData.score}/${rawData.maxScore} (${context.raw.toFixed(1)}%)`;
                        }
                    }
                },
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: '得分百分比'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    }
                }
            }
        }
    });
}

function exportResult() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const lastResult = history[history.length - 1];
    
    const data = {
        testType: tests[lastResult.testId].title,
        date: new Date(lastResult.date).toLocaleString(),
        score: lastResult.score,
        maxScore: lastResult.maxScore,
        result: lastResult.result
    };

    const csv = `测试类型,日期,得分,总分,结果\n${data.testType},${data.date},${data.score},${data.maxScore},${data.result}`;
    downloadFile('测评结果.csv', csv);
}

function exportHistory() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const csv = ['测试类型,日期,得分,总分,结果'];
    
    history.forEach(record => {
        csv.push(`${tests[record.testId].title},${new Date(record.date).toLocaleString()},${record.score},${record.maxScore},${record.result}`);
    });

    downloadFile('测评历史记录.csv', csv.join('\n'));
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 添加页面导航函数
function showHome() {
    document.getElementById('test-list').style.display = 'block';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('history-container').style.display = 'none';
    document.getElementById('about-container').style.display = 'none';
    updateRecentTests(); // 更新最近测评显示
}

function updateRecentTests() {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    const recentTests = [...history].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 3);
    
    const container = document.getElementById('recent-tests');
    
    if (recentTests.length === 0) {
        container.innerHTML = '<p>暂无测评记录</p>';
        return;
    }

    container.innerHTML = recentTests.map(record => `
        <div class="recent-test-item">
            <p>测试日期：${formatDate(record.date)}</p>
            <p>总体状况：${record.overallStatus || '未知'}</p>
            ${record.results ? `
                <div class="result-summary">
                    <p>焦虑：${record.results.anxiety.level}</p>
                    <p>抑郁：${record.results.depression.level}</p>
                    <p>压力：${record.results.stress.level}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// 添加一个函数来格式化日期显示
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 添加删除单条记录的函数
function deleteRecord(index) {
    if (confirm('确定要删除这条记录吗？')) {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.splice(index, 1);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        viewHistory(); // 刷新历史记录显示
    }
}

// 添加清空所有记录的函数
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？此操作不可恢复！')) {
        localStorage.setItem(HISTORY_KEY, '[]');
        showHome(); // 返回首页
    }
}

// 添加相应的 CSS 样式
const style = document.createElement('style');
style.textContent = `
    .history-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }

    .delete-btn {
        background-color: #ff4444;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .delete-btn:hover {
        background-color: #cc0000;
    }

    .danger-btn {
        background-color: #ff4444;
        color: white;
    }

    .danger-btn:hover {
        background-color: #cc0000;
    }

    .history-actions {
        display: flex;
        gap: 10px;
        justify-content: center;
        margin: 20px 0;
    }

    .history-item {
        background: var(--white);
        padding: 1.5rem;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .history-item:hover {
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    showHome();
    updateRecentTests();
});

// 添加显示关于我们页面的函数
function showAbout() {
    document.getElementById('test-list').style.display = 'none';
    document.getElementById('test-container').style.display = 'none';
    document.getElementById('history-container').style.display = 'none';
    document.getElementById('about-container').style.display = 'block';
}

// 生成报告ID
function generateReportId() {
    return 'R' + Date.now().toString(36).toUpperCase();
}

// 获取建议
function getSuggestions(results) {
    let suggestions = [];
    
    if (results.anxiety.level !== '正常') {
        suggestions.push('建议进行适当的放松训练，如深呼吸、冥想等。');
    }
    if (results.depression.level !== '正常') {
        suggestions.push('建议增加户外活动和社交互动，保持规律的作息时间。');
    }
    if (results.stress.level !== '正常') {
        suggestions.push('建议学习时间管理技巧，适当进行运动来缓解压力。');
    }
    
    if (suggestions.length === 0) {
        return '您的心理状态良好，建议继续保持健康的生活方式。';
    }
    
    return suggestions.join(' ');
}

// 打印功能
function printResult() {
    const content = document.getElementById('result-content');
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>心理健康评测报告</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px;
                        color: #333;
                    }
                    .result-item { 
                        margin: 20px 0;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                    }
                    .result-summary {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 8px;
                    }
                    .result-suggestions {
                        margin: 20px 0;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                    }
                    @media print {
                        .result-actions { display: none; }
                    }
                </style>
            </head>
            <body>
                ${content.innerHTML}
            </body>
        </html>
    `);
    
    printWindow.document.close();
    
    // 等待资源加载完成后打印
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // printWindow.close();
    }, 500);
}

// 导出为PDF
function exportToPDF() {
    const element = document.getElementById('result-content');
    
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false // 关闭日志
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('心理健康评测报告.pdf');
    });
}

// 导出为图片
function exportToImage() {
    const element = document.getElementById('result-content');
    
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false // 关闭日志
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = '心理健康评测报告.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
}

// 添加提示信息功能
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // 2秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 2000);
} 