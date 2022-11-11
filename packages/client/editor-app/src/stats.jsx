import React, {useEffect} from "react";
//import Plotly from "plotly.js-dist";

async function processData(courses, data, metric, y_axis, id) {
    let course_dict = {};
    for (let course of courses) {
        course_dict[course.id] = course.learning + "-" + course.from;
    }

    let data_list = [];
    let data_list_dict = {};
    for (let row of data) {
        let xx = row.yr + "-" + row.mth;
        if (row.course_id === null)
            continue
        if (data_list_dict[row.course_id] === undefined) {
            let new_data = {
                x: [],
                y: [],
                name: course_dict[row.course_id],
                type: 'bar'
            };
            data_list_dict[row.course_id] = new_data;
            data_list.push(new_data);
        }
        data_list_dict[row.course_id].x.push(xx);
        data_list_dict[row.course_id].y.push(parseFloat(row[metric]));
    }
    Plotly.newPlot(id, data_list, {barmode: 'stack', yaxis: {title: y_axis,}, xaxis: {title: "time"}});
}

async function plotMonth(courses, data, metric, y_axis, id, index) {
    let course_dict = {};
    for (let course of courses) {
        course_dict[course.id] = course.learning + "-" + course.from;
    }

    let dates = {};
    for (let row of data) {
        let xx = row.yr + "-" + row.mth;
        if (row.course_id === null)
            continue
        if (dates[xx] === undefined) {
            dates[xx] = {};
        }
        dates[xx][row.course_id] = row;
    }
    let xx = Object.keys(dates)[index];
    let dd = Object.entries(dates[xx]).sort((a, b) => (parseFloat(a[1][metric]) < parseFloat(b[1][metric])))
    let trace1 = {
        x: [],
        y: [],
        type: 'bar',
    };
    for (let d of dd) {
        trace1.x.push(course_dict[d[1].course_id])
        trace1.y.push(d[1][metric])
    }
    console.log("trace1", trace1)
    Plotly.newPlot(id, [trace1], {yaxis: {title: y_axis,}, xaxis: {title: xx, tickangle: -45}});
}

async function load() {
    let resp = await fetch("https://editor.duostories.org/get/stats");
    let [courses, data] = await resp.json();

    processData(courses, data, "stories_done", "Stories Done", "tester")
    processData(courses, data, "user_count", "Reg. Active Users", "testerB")

    plotMonth(courses, data, "stories_done", "Stories Done", "tester2", 0)
    plotMonth(courses, data, "user_count", "Reg. Active Users", "tester2B", 0)

    plotMonth(courses, data, "stories_done", "Stories Done", "tester3", 1)
    plotMonth(courses, data, "user_count", "Reg. Active Users", "tester3B", 1)


}



export function Stats() {
    return <div>Stats are disabled for now until I implement them in a more efficient way.</div>
    useEffect(() => load());
    return <>
    <div id="tester" style={{width:"600px", height: "400px"}}></div>
    <div id="testerB" style={{width:"600px", height: "400px"}}></div>
    <div id="tester2" style={{width:"1200px", height: "400px"}}></div>
    <div id="tester2B" style={{width:"1200px", height: "400px"}}></div>
    <div id="tester3" style={{width:"1200px", height: "400px"}}></div>
    <div id="tester3B" style={{width:"1200px", height: "400px"}}></div>
    <div id="text"></div>
    <script>

    </script>
    </>
}