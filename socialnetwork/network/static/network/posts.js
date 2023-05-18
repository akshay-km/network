try {
document.getElementById('profile').addEventListener('click', event => load_profile(event.target.dataset.id));
document.getElementById('#following').addEventListener('click',() => load_post('following'));
document.getElementById('new-post-form').onsubmit = create_post;
} catch (err) {
    console.log(`Error: ${err}`);
}

document.getElementById('#allposts').addEventListener('click', () => load_post('allposts'));
load_post('allposts');

function get_csrf() {
    let csrftoken = null;
    try {
        csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    } catch(err) {
        console.log(`Error fetching csrf token :${err}`);
    }
    return csrftoken;
}

function Post({post}){                              
    function handle_poster_click(){
        load_profile(post.poster_id);
    }
    
    const [edit, setEdit ] = React.useState ({
        visible: false,
        content: post.content,
        error: null
    });
    
    React.useEffect(() => {
        setEdit ({
            visible: false,
            content: post.content,
            error: null
        });
    },[post]);

    function handle_edit_click() {
        setEdit({
            ...edit,
            visible: true,
        });
    }
  
    function handle_cancel() {
        setEdit({
            ...edit, 
            visible: false
        });
    }

    function save_edit(event){
        event.preventDefault();
        let new_content = event.target.querySelector('textarea').value;
         fetch(`/edit/${post.id}`, {
             method: 'PUT',
           headers : {'X-CSRFToken': get_csrf()},
            body: JSON.stringify({
            content: new_content
            })
            })
            .then(response => response.json())
            .then(result => {
                if (result.message) {
                    console.log(`Message: ${result.message}`);
                    setEdit({
                        ...edit,
                        visible: false,
                        content : new_content
                    });
                } else {
                    console.log(`Error: ${result.error}`);
                    setEdit({
                        ...edit, 
                        error: result.error
                    });
                }
            });
        return false;
    }

    const edit_form= (<form className='edit-form' onSubmit={save_edit}>
                        <textarea className='edit-form-input' required>{edit.content}</textarea>
                        <div className="editbtn">
                            <input type="submit" className=" btn btn-primary" value="Save"/>
                            <button className=" btn btn-secondary" onClick={handle_cancel}>Cancel</button>
                        </div>
                        { edit.error && <div class="alert alert-danger" role="alert" >Post updation error: {edit.error} </div>}
                    </form>);

    return (
        <div key={post.id} className="post-container">
            <h5 className="poster" onClick={handle_poster_click}>{post.poster}</h5>  
            {post.enable_edit && <div className="edit-link btn btn-link" onClick={handle_edit_click} >Edit</div>}
            { !edit.visible && <div className="post-content">{edit.content}</div> } 
            {edit.visible && edit_form }
            <div className="post-timestamp">{post.timestamp}</div>
        <LikeButton post={post}/>
        </div>
    );
}



function LikeButton({post}){
    const [isliked , setIsliked] = React.useState ({
        liked: post.is_liked,
        likes: post.likes});
    function handle_like() {
        const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
        fetch('/like',{
             method: 'POST',
             headers : {'X-CSRFToken': get_csrf()},
             mode: 'same-origin',
             body : JSON.stringify( {
                post_id : post.id 
             })
            }
        )
        .then( response => response.json())
        .then(result => {
            if (result.message) {
                console.log(`${result.message}`);
                setIsliked({
                    liked: !isliked.liked,
                    likes: isliked.liked? isliked.likes-1: isliked.likes+1}
                    ); 
            } else {
                console.log(`${result.error}`);
            }
             });
    }

  return (
    <div className="like-wrapper">
    <i className="material-icons favorite-icon" onClick={handle_like} style={ isliked.liked? {color:"red"}:{color:"black"}}>{ isliked.liked ? "favorite" : "favorite_border"}</i>
    <div className="likes-count">{isliked.likes}</div>
    </div>
  );

}


function PageApp({page}){

    const[currentPage, setCurrentPage] = React.useState(page);

    React.useEffect(()=> {
        setCurrentPage(page);
    },[page]);


    function handle_page_change(new_page) {
        setCurrentPage(new_page);
    }

    return (
        <div> 
            <PostsApp posts={currentPage.posts} />
            <Paginator page={currentPage} onPageChange={handle_page_change}/>

        </div> 
    );

}

function Paginator({page, onPageChange}) {
    const numbers = [];
    for (let i=1; i<= page.num_pages; i++) {
     if (i !== page.number) {
        numbers.push(<li className="page-item"><a class="page-link" onClick={()=> handle_paginator_click(i)} href="#">{i}</a></li> );
      } else {
        numbers.push(<li class="page-item active" aria-current="page">
                        <span className="page-link" href="#">{i} <span class="sr-only">(current)</span></span>
                    </li>);
        }
    }

    function handle_paginator_click(page_num) {
        fetch(`/posts/${page.name}?page=${page_num}`)
        .then(response => response.json())
        .then(new_page => {
            onPageChange(new_page);
        });

    }
    return (
        <div className="paginator">
            <nav aria-label="...">
                <ul className="pagination">
                    <li className={`page-item ${page.has_previous?  '':'disabled'}`}>
                        { page.has_previous? <a className="page-link" onClick={()=>  handle_paginator_click(page.number-1)} href="#">Previous</a> :<span className="page-link">Previous</span>}
                    </li>
                    {numbers}
                    <li className={`page-item ${page.has_next ? '': 'disabled'}`}>
                    { page.has_next? <a className="page-link"  onClick={()=> handle_paginator_click(page.number+1)} href="#">Next</a> : <span className="page-link">Next</span>}
                    </li>
                </ul>
            </nav>
      </div>
    );

}

function NoPosts () {
    return (
        <h4 className = "no-posts"> No posts here! </h4>
        );
    }

function PostsApp({posts}) {
    const[new_posts, setPostlist] = React.useState(posts);
    
    React.useEffect(() => {
        setPostlist(posts);
    },
    [posts]);

    if (new_posts.length === 0) {
        return (
            <NoPosts />
        );
    } else {
    const post_list = [];
    new_posts.forEach(post => post_list.push(<Post post={post}/>));
    return (
            <div className="Allposts">
                {post_list}
            </div>
       ); }
}



function load_post(page) {
    document.getElementById('profile-view').style.display ='none';
    document.getElementById('posts-view').style.display= 'block';

    if (page === "allposts") {
        document.getElementById('page-title').innerHTML = "All Posts";
        document.getElementById('new-post') && (document.getElementById('new-post').style.display = 'block');
    } else if( page ==="following") {
     document.getElementById('page-title').innerHTML =  "Following";
     document.getElementById('new-post') && (document.getElementById('new-post').style.display = 'none');
    } 
    fetch(`/posts/${page}?page=1`,)
    .then(response => response.json())
    .then(page => {
        ReactDOM.render(<PageApp page={page}/>,document.getElementById('posts-root'))
    });      
}


function create_post() {
    const post_content = document.getElementById('new-post-content');

    fetch('/create', {
        method: 'POST',
        headers : {'X-CSRFToken': get_csrf()},
        body: JSON.stringify({
            content: post_content.value 
        })
    })
    .then(response => response.json())
    .then( results => {
        if (results.message) {
        console.log(`${results.message}`);
        load_post('allposts');
        post_content.value = "";
        } else { 
            console.log(`${results.error}`);
        } 
    });
    return false;
}



function ProfileApp({profile}) {
    window.scrollTo(0,0);
    const [fnum, setFnum] = React.useState(profile.followers_count);

    React.useEffect( ()=> {
        setFnum(profile.followers_count);
    }, [profile]);

    function handle_fnum_change(action) {
        const new_fnum = action =="follow" ? fnum+1 : fnum-1;
        setFnum(new_fnum);
    }

    return ( <div className="profile-wrapper">
                <div className ="profile-container">
                    <h2 id="profile-username">{profile.username}</h2>
                    <div id="follow-count">
                        <span className="follow-num"><strong> Followers: {fnum} </strong></span>
                        <span className="follow-num"><strong> Following: {profile.followings_count} </strong></span>
                    </div>
                    {  profile.follow_button && <FollowButton profile={profile} onFollowChange={handle_fnum_change}/>}
                </div>
                <hr />
                <h4 id="profile-posts-title">Posts by {profile.username}</h4>
                <PageApp page={profile.page}/>
            </div>
    );
}



function FollowButton({profile, onFollowChange}){
    const [data ,setData] = React.useState( {
        text : profile.is_following ? "Following" : "Follow",
        class_name : profile.is_following ? "btn btn-secondary" : "btn btn-primary"
    });

    React.useEffect(() => {
        setData({
          text: profile.is_following ? "Following" : "Follow",
          class_name: profile.is_following ? "btn btn-secondary" : "btn btn-primary"
        });
      }, [profile]);

    function handle_follow() {
        
        fetch(`follow/${profile.id}`,{
            method: 'POST',
            headers: {'X-CSRFToken': get_csrf()}
        })
        .then(response => response.json())
        .then(result => {
            if (result.message) {
                console.log(`Message: ${result.message}`);
                let new_text ="";
                let btn_class="";
                if (result.message.startsWith('Follow')) {
                    new_text = "Following" ;
                    btn_class= "btn btn-secondary";
                    onFollowChange('follow');
                } else { 
                    new_text ="Follow";
                    btn_class = "btn btn-primary";
                    onFollowChange('unfollow');
                }
                setData( {
                    text: new_text,
                    class_name : btn_class
                });

            } else {
                console.log(`Error: ${result.error}`);
                
            } 
        });

    }

return (
    <button type="button" id="followbtn" onClick={handle_follow} className={data.class_name}>{data.text}</button>
);
}

// LOAD PROFILE

function 
load_profile(id) {
    document.getElementById('posts-view').style.display = 'none';
    document.getElementById('profile-view').style.display ='block';

    fetch(`/profile/${id}?page=1`)
    .then(response => response.json())
    .then( profile => { 
        ReactDOM.render(<ProfileApp profile={profile} />, document.getElementById('profile-view'));
    });
}