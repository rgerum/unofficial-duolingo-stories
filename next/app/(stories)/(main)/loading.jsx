import MainTitle from "./main_title";
import TitleDesc from "./title_desc";
import Link from "next/link";
import CourseList from "./course_list";


export default function Loading() {
    // You can add any UI inside Loading, including a Skeleton.
    return <>
        <header>
            <MainTitle>Unofficial Duolingo Stories</MainTitle>
            <TitleDesc>
                A community project to bring the original <Link href="https://www.duolingo.com/stories">Duolingo Stories</Link> to new languages.
                <br/><span style={{display: "inline-block", width: "50px", background:"gray"}}></span> stories in courses and counting!
            </TitleDesc>
            <TitleDesc>
                If you want to contribute or discuss the stories, meet us on <Link href="https://discord.gg/4NGVScARR3">Discord</Link><br/>
                or learn more about the project in our <Link href={"/faq"}>FAQ</Link>.
            </TitleDesc>
        </header>
        <div>
            <CourseList/>
        </div>
    </>
}
