import React from "react";
import Head from 'next/head'

import {get_stats} from "../../api/stats/[year]/[month]";
import Flag from "../../../components/layout/flag";
import StatsElement from "../../../components/stats/stats_element";
import StatsElement2 from "../../../components/stats/stats_element2";

function arrayRemove(arr, value) {

    return arr.filter(function(ele){
        return ele != value;
    });
}

function DataGroup({title, data, data_old, key_name}) {
    let courses = {};
    for(let c of data["courses"]) {
        courses[c.id] = c;
    }
    let languages = {};
    for(let l of data["languages"]) {
        languages[l.id] = l;
    }
    let story_ids = [];
    let total_count = 0;
    let total_count_old = 0;
    for(let l of data[key_name]) {
        story_ids.push(l.course_id);
        total_count += l.count;
    }
    let old_stories = {}
    for(let l of data_old[key_name]) {
        old_stories[l.course_id] = l
        total_count_old += l.count;
        if(!story_ids.includes(l.course_id)) {
            data[key_name].push({course_id:l.course_id, count: 0});
        }
    }
    return <><h2>{title} {data[key_name+"_count"] || total_count} <span style={{fontSize: "0.8em"}}>{data_old[key_name+"_count"] || total_count_old}</span></h2>
        <div style={{margin: "0 16px",
            overflowX: "scroll", display: "flex", width: "830px"}}>
            {data[key_name].map((d, i) =>
                <StatsElement key={i} lang1={languages[courses[d.course_id].learningLanguage]}
                              lang2={languages[courses[d.course_id].fromLanguage]}
                              count={d.count} count_old={old_stories[d.course_id]?.count}
                              max_count={Math.max(data[key_name][0].count, data_old[key_name][0].count)}/>
            )}
        </div>
    </>
}

function ref_by_course(data, data_old, key) {
    let refs = {};
    let index = 1;
    let max_count = Math.max(data[key][0].count, data_old[key][0].count)
    for(let c of data[key]) {
        refs[c.course_id] = {count: c.count, count_old: 0, rank: index, max_count: max_count};
        index += 1;
    }
    let index_old = 1;
    for(let c of data_old[key]) {
        if(!refs[c.course_id])
            refs[c.course_id] = {count: 0, max_count: max_count}
        refs[c.course_id].count_old = c.count;
        refs[c.course_id].rank_old = index_old;
        index_old += 1;
    }
    return refs;
}

export default function Stats({data, data_old}) {
    let courses = {};
    for(let c of data["courses"]) {
        courses[c.id] = c;
    }
    let languages = {};
    for(let l of data["languages"]) {
        languages[l.id] = l;
    }
    let months = {
        "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
        "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
    }
    let stories_published = ref_by_course(data, data_old, "stories_published");
    let stories_read = ref_by_course(data, data_old, "stories_read");
    let active_users = ref_by_course(data, data_old, "active_users");
    let active_stories = ref_by_course(data, data_old, "active_stories");
    let stats_course = [];
    for(let c of data["courses"]) {
        if(c.public)
            stats_course.push({
                id: c.id,
                learningLanguage: languages[c.learningLanguage],
                fromLanguage: languages[c.fromLanguage],
                stories_published: stories_published[c.id],
                stories_read: stories_read[c.id],
                active_users: active_users[c.id],
                active_stories: active_stories[c.id],
            })
    }

    return <>
        <Head>
            <title>{`Duostories`}</title>
        </Head>
        <div style={{width: "800px", margin: "auto 0"}}>
        <h1>Report {months[data.month]} {data.year}</h1>
        <DataGroup title={"Stories Published"} data={data} data_old={data_old} key_name={"stories_published"}/>
        <DataGroup title={"Stories Read"} data={data} data_old={data_old} key_name={"stories_read"}/>
        <DataGroup title={"Active Users"} data={data} data_old={data_old} key_name={"active_users"}/>
        <DataGroup title={"Active Stories"} data={data} data_old={data_old} key_name={"active_stories"}/>
        <h2>Course Statistics</h2>
        {stats_course.map((c, i) => <StatsElement2 key={i} course={c}/>)}
        </div>
    </>
}

export async function getServerSideProps({params}) {
    // Fetch data from external API
    //const res = await fetch(`https://test.duostories.org/stories/backend_node_test/story/${params.story}`)
    //const story = await res.json()
    const data = await get_stats(params.year, params.month);
    data.year = params.year;
    data.month = params.month;
    const data_old = await get_stats((params.month == 1) ? params.year-1 : params.year, (params.month == 1) ? 12 : params.month-1);
    data_old.year = (params.month == 1) ? params.year-1 : params.year;
    data_old.month = (params.month == 1) ? 12 : params.month-1;

    // Pass data to the page via props
    return { props: { data, data_old } }
}
