const tests = {
    comprehensive: {
        title: "综合心理评测",
        questions: [
            // 焦虑相关题目
            {
                question: "我感到紧张不安或心烦意乱",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "anxiety"
            },
            {
                question: "我无缘无故感到害怕",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "anxiety"
            },
            {
                question: "我容易心烦意乱或感到恐慌",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "anxiety"
            },
            // 抑郁相关题目
            {
                question: "我感到心情低落",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "depression"
            },
            {
                question: "我对事物失去兴趣",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "depression"
            },
            {
                question: "我感到疲倦或没有精力",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "depression"
            },
            // 压力相关题目
            {
                question: "我感到难以放松",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "stress"
            },
            {
                question: "我发现自己容易烦躁",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "stress"
            },
            {
                question: "我感到压力很大",
                options: ["从不", "有时", "经常", "总是"],
                scores: [0, 1, 2, 3],
                type: "stress"
            }
        ],
        getResult: function(scores) {
            const results = {
                anxiety: {
                    score: scores.anxiety,
                    maxScore: 9, // 3题 * 最高分3
                    level: this.getLevel(scores.anxiety, 9)
                },
                depression: {
                    score: scores.depression,
                    maxScore: 9,
                    level: this.getLevel(scores.depression, 9)
                },
                stress: {
                    score: scores.stress,
                    maxScore: 9,
                    level: this.getLevel(scores.stress, 9)
                }
            };

            return results;
        },
        getLevel: function(score, maxScore) {
            const percentage = (score / maxScore) * 100;
            if (percentage <= 25) return "正常";
            if (percentage <= 50) return "轻度";
            if (percentage <= 75) return "中度";
            return "重度";
        }
    }
}; 