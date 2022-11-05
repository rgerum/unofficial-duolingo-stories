create table avatar
(
    id   int          not null
        primary key,
    link char(100)    not null,
    name varchar(100) null,
    constraint avatar_id_uindex
        unique (id)
);

create table image
(
    id        char(50)  not null
        primary key,
    active    char(255) not null,
    gilded    char(255) not null,
    locked    char(255) not null,
    activeLip char(255) not null,
    gildedLip char(255) not null
);

create table language
(
    id           int auto_increment
        primary key,
    name         varchar(100) charset latin1 not null,
    short        varchar(5)                  not null,
    flag         float                       null,
    public       int     default 0           not null,
    flag_file    varchar(50)                 null,
    speaker      varchar(50)                 null,
    rtl          tinyint default 0           not null,
    default_text varchar(100)                null
)
    collate = utf8_unicode_ci;

create table avatar_mapping
(
    id          int auto_increment
        primary key,
    avatar_id   int       null,
    language_id int       null,
    name        char(100) null,
    speaker     char(100) null,
    constraint avatar_mapping_avatar_id_language_id_uindex
        unique (avatar_id, language_id),
    constraint avatar_mapping_avatar_id_fk
        foreign key (avatar_id) references avatar (id),
    constraint avatar_mapping_language_id_fk
        foreign key (language_id) references language (id)
);

create table course
(
    id               int auto_increment
        primary key,
    learningLanguage int        default 0   not null,
    fromLanguage     int        default 0   not null,
    public           tinyint    default 0   not null,
    official         int        default 0   not null,
    name             char(255) charset utf8 null,
    about            text                   null,
    conlang          tinyint(1) default 0   null,
    constraint course_language_id_fk
        foreign key (learningLanguage) references language (id),
    constraint course_language_id_fk_2
        foreign key (fromLanguage) references language (id)
);

create table lexicon
(
    id          int auto_increment
        primary key,
    language_id int default 0 null,
    content     mediumtext    null
);

create table speaker
(
    id          int auto_increment
        primary key,
    language_id int                       null,
    speaker     varchar(50)               null,
    gender      enum ('MALE', 'FEMALE')   null,
    type        enum ('NORMAL', 'NEURAL') null,
    service     varchar(50)               null,
    constraint speaker_speaker_uindex
        unique (speaker)
);

create table story
(
    id           int auto_increment
        primary key,
    duo_id       varchar(50) charset utf8               null,
    name         varchar(255) charset utf8              not null,
    set_id       int                                    null,
    set_index    int                                    null,
    xp           int        default 0                   not null,
    cefr         varchar(50) charset utf8               null,
    name_base    varchar(255) charset utf8              not null,
    lang         int                                    not null,
    lang_base    int                                    not null,
    author       int                                    not null,
    date         timestamp  default current_timestamp() not null,
    change_date  timestamp  default current_timestamp() not null,
    text         mediumtext charset utf8                not null,
    public       tinyint    default 0                   null,
    image        varchar(255) charset utf8              null,
    image_done   varchar(255) charset utf8              null,
    image_locked varchar(255) charset utf8              null,
    discussion   varchar(255) charset utf8              null,
    course_id    int                                    null,
    json         mediumtext charset utf8                null,
    api          int        default 1                   not null,
    status       char(50)   default 'draft'             null,
    deleted      tinyint(1) default 0                   null
)
    charset = latin1;

create table story_approval
(
    id       int auto_increment
        primary key,
    story_id int                                  not null,
    user_id  int                                  not null,
    date     datetime default current_timestamp() not null,
    constraint story_approval_story_id_user_id_uindex
        unique (story_id, user_id)
);

create table story_done
(
    id       int auto_increment
        primary key,
    user_id  int                                   null,
    story_id int                                   not null,
    time     timestamp default current_timestamp() not null
)
    charset = latin1;

create table user
(
    id              int auto_increment
        primary key,
    username        varchar(100) charset latin1           not null,
    password        varchar(100) charset latin1           not null,
    email           varchar(100) charset latin1           not null,
    regdate         timestamp default current_timestamp() not null,
    role            int       default 0                   not null,
    admin           int       default 0                   not null,
    activated       tinyint   default 0                   not null,
    activation_link varchar(255)                          null
)
    collate = utf8_unicode_ci;

create table user_pw_reset
(
    id      int auto_increment
        primary key,
    user_id int                                   not null,
    uuid    char(36)  default '0'                 not null,
    time    timestamp default current_timestamp() not null
);

