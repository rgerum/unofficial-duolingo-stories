create type gender_enum as enum ('MALE', 'FEMALE');
create type type_enum as enum ('NORMAL', 'NEURAL');
create type story_status as enum ('draft', 'feedback', 'finished');

create table image
(
    id         varchar(50)  not null
        primary key,
    active     varchar(255) not null,
    gilded     varchar(255) not null,
    locked     varchar(255) not null,
    active_lip varchar(6)   not null,
    gilded_lip varchar(6)   not null
);

create table language
(
    id           serial
        primary key,
    name         varchar(100)          not null,
    short        varchar(10)           not null
        unique,
    flag         double precision,
    flag_file    varchar(50),
    speaker      varchar(50),
    default_text varchar(100),
    tts_replace  text,
    public       boolean default false not null,
    rtl          boolean default false not null
);

create table avatar
(
    id   serial
        primary key,
    link varchar(100) not null,
    name varchar(100) default NULL::character varying
);

create table users
(
    id              serial
            primary key,
    name            varchar(255)                                                      not null,
    password        varchar(255),
    email           varchar(255)                                                      not null,
    "emailVerified" timestamp with time zone,
    image           text,
    regdate         timestamp with time zone default CURRENT_TIMESTAMP,
    role            boolean                  default false,
    admin           boolean                  default false,
    activated       boolean                  default false,
    activation_link varchar(255)             default NULL::character varying
);

create table accounts
(
    id                  serial
            primary key,
    "userId"            integer                                             not null
            references users,
    type                varchar(255)                                        not null,
    provider            varchar(255)                                        not null,
    "providerAccountId" varchar(255)                                        not null,
    refresh_token       text,
    access_token        text,
    expires_at          bigint,
    token_type          text,
    scope               text,
    id_token            text,
    session_state       text
);

create table speaker
(
    id          serial
        primary key,
    language_id integer     not null
        references language,
    speaker     varchar(50) not null
        unique,
    gender      gender_enum not null,
    type        type_enum   not null,
    service     varchar(50) not null
);

create table localization
(
    id          serial
        primary key,
    language_id integer      not null
        references language,
    tag         varchar(100) not null,
    text        text         not null,
    constraint localization_pk
        unique (language_id, tag)
);

create table avatar_mapping
(
    id          serial
        primary key,
    avatar_id   integer not null
        references avatar,
    language_id integer not null
        references language,
    name        varchar(100),
    speaker     varchar(100),
    unique (avatar_id, language_id)
);

create table course
(
    id                serial
        primary key,
    short             varchar(20)
        unique,
    learning_language integer
            references language,
    from_language     integer
            references language,
    public            boolean default false not null,
    official          boolean default false not null,
    name              varchar(255),
    about             text,
    conlang           boolean default false,
    tags              varchar(20)[],
    count             integer,
    learning_language_name varchar(255),
    from_language_name varchar(255),
    contributors      varchar(255) [] default '{}'::character varying[] not null,
    contributors_past varchar(255)[] default '{}'::character varying[] not null,
);

create table sessions
(
    id             serial
            primary key,
    expires        timestamp with time zone                            not null,
    "sessionToken" varchar(255)                                        not null,
    "userId"       integer                                             not null
            references users
);

create table verification_token
(
    id         serial,
    token      text                     not null,
    identifier text                     not null,
    expires    timestamp with time zone not null,
    primary key (identifier, token)
);

create table story
(
    id             serial
        primary key,
    duo_id         varchar(50),
    name           varchar(255),
    set_id         integer not null,
    set_index      integer not null,
    author         integer
        references users,
    author_change  integer
        references users,
    date           timestamp with time zone default CURRENT_TIMESTAMP,
    change_date    timestamp with time zone default CURRENT_TIMESTAMP,
    date_published timestamp with time zone,
    text           text,
    public         boolean                  default false,
    image          varchar(50)
        references image,
    course_id      integer
        references course,
    json           jsonb,
    status         story_status             default 'draft'::story_status,
    deleted        boolean                  default false
);

create table story_done
(
    id       serial
        primary key,
    user_id  integer
        references users,
    story_id integer
            references story
            on delete cascade,
    time     timestamp with time zone default CURRENT_TIMESTAMP
);

create table story_approval
(
    id       serial
        primary key,
    story_id integer
            references story
            on delete cascade,
    user_id  integer
        references users,
    date     timestamp with time zone default CURRENT_TIMESTAMP,
    unique (story_id, user_id)
);
