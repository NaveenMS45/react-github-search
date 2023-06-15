import React, { useState, useEffect,useContext } from 'react';
import mockUser from './mockData.js/mockUser';
import mockRepos from './mockData.js/mockRepos';
import mockFollowers from './mockData.js/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

// provider, consumer - GithubContext.Provider

const GithubProvider = ({children}) => {
    const [githubUser, setGithubUser] = useState(mockUser)
    const [repos, setRepos] = useState(mockRepos)
    const [followers, setFollowers] = useState(mockFollowers)

    // request, loading
    const [req,setReq] = useState(0);
    const [loading, setLoading] = useState(true);
    // error
    const [error, setError] = useState({show:false,msg: ""}); 

    const searchGithubUser = async (user) => {
      toggleError()
      // setLoading(true);
      const res = await axios(`${rootUrl}/users/${user}`).catch(err => {console.log(err)})
      if (res){
        setGithubUser(res.data)
        const {login, followers_url} = res.data;
        await Promise.allSettled([
          axios(`${rootUrl}/users/${login}/repos?per_page=100`),
          axios(`${followers_url}?per_page=100`),
        ]).then((res) => {
          const [repos, followers] = res;
          const status = "fulfilled";
          if (repos.status === status) {
            setRepos(repos.value.data);
          }
          if (followers.status === status) {
            setFollowers(followers.value.data);
          }
        });
      }else {
        toggleError(true, "Couldn't find the user")
      }
      checkRate();
      setLoading(false)
    }

    const checkRate = () => {
      axios.get(`${rootUrl}/rate_limit`)
      .then(({data}) => {
        let {rate:{remaining}} = data;
        setReq(remaining);
        if(remaining === 0){
          toggleError(true, "rate limit exceeded");
        }
        // throw an error
      })
      .catch(err => {
        console.log(err)
      })
    }

    useEffect(() => {
      checkRate();
    }, [])

    function toggleError (show = false,msg = "") {
      setError({show,msg})
    }
    return (
      <GithubContext.Provider value={{githubUser,repos,followers,req,loading,error,searchGithubUser}}>
        {children}
      </GithubContext.Provider>
    );
       
}

// make sure use
export const useGlobalContext = () => {
  return useContext(GithubContext)
}

export { GithubContext, GithubProvider } 
