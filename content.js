let cleanupRows;
// 表の変化があったときに走る処理
const func = () => {
    console.log("a");
    mutationObserver.disconnect();
    cleanupRows?.();
    cleanupRows = undefined;

    const taskDialog = document.querySelector(".vb-taskDialog");
    if (taskDialog) {
        // 日付をフォーマットする関数
        const dateFormat = {
            _fmt: {
                "yyyy": function (date) { return date.getFullYear() + ''; },
                "MM": function (date) { return ('0' + (date.getMonth() + 1)).slice(-2); },
                "dd": function (date) { return ('0' + date.getDate()).slice(-2); },
                "hh": function (date) { return ('0' + date.getHours()).slice(-2); },
                "mm": function (date) { return ('0' + date.getMinutes()).slice(-2); },
                "ss": function (date) { return ('0' + date.getSeconds()).slice(-2); }
            },
            _priority: ["yyyy", "MM", "dd", "hh", "mm", "ss"],
            format: function (date, format) {
                return this._priority.reduce((res, fmt) => res.replace(fmt, this._fmt[fmt](date)), format)
            }
        };

        // 時間の計算
        let time_i = 0;
        let workAmount = 0;
        let restAmount = 0;
        let today = dateFormat.format(new Date(), 'yyyy-MM-dd');
        const firstCaptionNum = Number(taskDialog.getElementsByClassName("vb-tableListCell__text")[0].id.replace(/[^0-9]/g, ''));
        // h:i 形式のstringをDate型に変換。24:00を超える場合も補正
        const convertDate = (timeStr) => {
            return Number(timeStr.slice(0, 2)) < 24
                ? new Date(`${today} ${timeStr}`)
                : new Date(`${today} ${('0' + (Number(timeStr.slice(0, 2)) - 24)).slice(-2)}:${timeStr.slice(-2)}`);
        }

        while (document.getElementsByName(`time_clocks[${time_i}].datetime`)[0]) {
            let t1_str = document.getElementsByName(`time_clocks[${time_i}].datetime`)[0].value;
            let t1 = convertDate(t1_str);

            let t2_str;
            let t2;
            if (document.getElementsByName(`time_clocks[${time_i + 1}].datetime`)[0]) {
                t2_str = document.getElementsByName(`time_clocks[${time_i + 1}].datetime`)[0].value;
                t2 = convertDate(t2_str);
            } else {
                t2 = new Date();
            }

            let diff = t2.getTime() - t1.getTime();
            if (diff < 0) {
                diff += 1000 * 60 * 60 * 24; // 日付をまたいでるときはマイナスになるので1日分足す
            }

            let diffMinute = Math.floor(diff / (1000 * 60));
            if (time_i % 2 === 0) {
                workAmount += diffMinute;
            } else if (document.getElementById(`vb-tabeListcell_${time_i * 4 + firstCaptionNum}__text`)
                && document.getElementById(`vb-tabeListcell_${time_i * 4 + firstCaptionNum}__text`).textContent !== "退勤") {
                restAmount += diffMinute;
            }
            time_i++;
        }

        // テーブルの末尾に行を追加する処理
        const tableElem = taskDialog.getElementsByClassName('vb-listTable__table')[0];
        const insertRow = (textList) => {
            const row = tableElem.tBodies[0].insertRow(-1);
            row.classList.add("vb-tableListRow");
            textList.map(content => {
                let cellElem = row.insertCell(-1);
                if (content !== "") {
                    cellElem.appendChild(document.createTextNode(content));
                    cellElem.classList.add("vb-tableListCell");
                }
            });
            return row;
        }
        const workAmountRow = insertRow(["", "勤務合計", `${Math.floor(workAmount / 60)}h ${workAmount % 60}m`, ""]);
        const restAmountRow = insertRow(["", "休憩合計", `${Math.floor(restAmount / 60)}h ${restAmount % 60}m`, ""]);

        cleanupRows = () => {
            workAmountRow.remove();
            restAmountRow.remove();
        }
    }

    observe();
};

const mutationObserver = new MutationObserver(func);
const observe = () => {
    mutationObserver.observe(
        document.body,
        { subtree: true, childList: true, characterData: true }
    );
};
observe();
