import React from "react";


export function Cast(props) {
    let cast = [];
    let no_speaker_count = 0;
    for(let id in props.story_meta.cast) {
        cast.push(props.story_meta.cast[id]);
        if(!props.story_meta.cast[id].speaker)
            no_speaker_count += 1;
    }
    return <div className="cast_element">
        <h2>Cast</h2>
        <table className="cast">
            <tbody>
            {cast.map((character, i) => (
                <Character key={i} character={character}  />
            ))}
            </tbody>
        </table>
        { no_speaker_count ?
            <p>{no_speaker_count} characters do not have a speaker voice assigned. Go to the <a target="_blank" href={"?language="+props.learningLanguage}>Character-Editor</a> to add the voices.</p> :
            <p>To change voices or names go to the <a target="_blank" href={"?language="+props.learningLanguage}>Character-Editor</a>.</p>
        }
    </div>
}

function Character(props) {
    let characer = props.character;
    return <tr className="character">
        <td style={{textAlign: "right"}}>{characer.id}</td>
        <td><img alt={"speaker head"} className="head" src={characer.link} /></td>
        <td>{characer.name}</td>
        <td><span className="ssml_speaker">{characer.speaker}</span></td>
    </tr>
}