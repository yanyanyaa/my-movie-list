const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const MOVIES_PER_PAGE = 12
let currentPage = 1

// movies: 電影總清單
const movies = []
// filteredMovies: 搜尋結果的電影清單
let filteredMovies = []

const modeChange = document.querySelector('#change-mode')
const dataPanel = document.querySelector('#data-panel')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')

// 函式：渲染每部電影資料的畫面
function renderMovieList(data) {
  if (dataPanel.dataset.mode === 'card-mode') {
    let rawHTML = ''
    data.forEach((item) => {
      // title, image
      rawHTML += `<div class="col-sm-3">
    <div class="mb-2">
      <div class="card">
        <img src="${POSTER_URL + item.image
        }" class="card-img-top" alt="Movie Poster">
        <div class="card-body">
          <h5 class="card-title">${item.title}</h5>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id
        }">More</button>
          <button class="btn btn-info btn-add-favorite" data-id="${item.id
        }" 
      }">+</button>
        </div>
      </div>
    </div>
  </div>`
    })
    dataPanel.innerHTML = rawHTML
  } else if (dataPanel.dataset.mode === 'list-mode') {
    let rawHTML = '<ul class="list-group">'
    data.forEach((item) => {
      rawHTML += `
        <li class="list-group-item">
          <h5>${item.title}</h5>
          <div>
            <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id="${item.id}">More</button>
            <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
          </div>
        </li >`
    })
    rawHTML += '</ul>'
    dataPanel.innerHTML = rawHTML
  }
}
  

// 函式：製作分頁器與渲染分頁器畫面，參數是電影數量
function renderPaginator(amount) {
  // 算出需要幾頁，無條件進位
  const numberOfPages = Math.ceil(amount / MOVIES_PER_PAGE)
  let rawHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${page}">${page}</a></li>`
  }
  paginator.innerHTML = rawHTML
}

// 函式：取該頁的電影資料，參數是頁碼
function getMoviesByPage(page) {
  // 讓此函式可通用於總清單與搜尋關鍵字：若搜尋框有內容用filteredMovies，否則用movies
  const data = filteredMovies.length ? filteredMovies : movies
  // 取得該頁第一步電影的索引位置
  //   page 1 -> movies 0 - 11
  //   page 2 -> movies 12 - 23
  //   ...
  const startIndex = (page - 1) * MOVIES_PER_PAGE
  // 將該頁的第一筆至最後一筆電影資料從data中提取出來
  return data.slice(startIndex, startIndex + MOVIES_PER_PAGE)
}

// 函式：渲染Modal的資料畫面，參數是該電影的id
function showMovieModal(id) {
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  modalTitle.textContent = ''
  modalImage.innerHTML = ''
  modalDate.textContent = ''
  modalDescription.textContent = ''

  axios.get(INDEX_URL + id).then(response => {
    const data = response.data.results
    modalTitle.textContent = data.title
    modalDate.textContent = 'Release date: ' + data.release_date
    modalDescription.textContent = data.description
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid"> />`
  })
}

// 函式：存取點了收藏的電影的資料，參數是該電影的id
function addToFavorite(id) {
  // 用localStorage.getItem('favoriteMovies')去取目前在 local storage 的資料，放進list
  // 但第一次點擊收藏按鈕時，localStorage尚未有favoriteMovies資料，所以用or空陣列
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  // 用find去movies查看，找出id相同的物件回傳，存在movie
  const movie = movies.find((movie) => movie.id === id)
  // 錯誤處理：用some去list檢查，看是否已有電影id與現在現在點擊的物件id相同，是的話給alert
  if (list.some((movie) => movie.id === id)) {
    // 使用return的意義在於：整段函式會執行到這裡，後面不繼續執行
    return alert('此電影已在收藏清單中！')
  }
  // 將movie資料推進list裡
  list.push(movie)
  // 將list存進localStorage
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
}

// 函式：切換顯示模式
function changeDisplayMode(mode) {
  if (dataPanel.dataset.mode === mode) return
  dataPanel.dataset.mode = mode
}


// 設置監聽器：當點選模式（清單或卡片）
modeChange.addEventListener('click', function onSwitchClicked(event) {
  if (event.target.matches('#card-mode-button')) {
    changeDisplayMode('card-mode')
    renderMovieList(getMoviesByPage(currentPage))
  } else if (event.target.matches('#list-mode-button')) {
    changeDisplayMode('list-mode')
    renderMovieList(getMoviesByPage(currentPage))
  }
})

// 設置監聽器：當點選show與add按鈕
dataPanel.addEventListener('click', function onPanelClicked(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    addToFavorite(Number(event.target.dataset.id))
  }
})

// 設置監聽器：當按下搜尋表格的submit按鈕
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  // 1. 取消預設事件
  event.preventDefault()
  // 2. 取得搜尋內容（關鍵字）
  const keyword = searchInput.value.trim().toLowerCase()

  // 原意：若沒有輸入內容就按搜尋，會跳警告
  // 但想想應該是顯示所有電影資料才對，故註解掉
  // if (!keyword.length) {
  //   return alert('Please enter a valid string')
  // }

  // 3. 將含關鍵字的電影抓進Movies陣列
  // 方法一：用for-of迴圈
  // for (const movie of movies) {
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie)
  //   }
  // }
  // 方法二：用陣列的filter
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )

  // 4. 若找不到符合關鍵字的資料，跳出alert
  // filteredMovies.length === 0 表示沒有任何電影放進filteredMovies陣列中
  if (filteredMovies.length === 0) {
    return alert(`您輸入的關鍵字：${keyword} 沒有符合條件的電影`)
  }
  currentPage = 1
  // 5. 重新渲染分頁器的畫面到網頁上
  renderPaginator(filteredMovies.length)
  // 6. 重新渲染搜尋結果第一頁的畫面到網頁上
  renderMovieList(getMoviesByPage(currentPage))
})

// 設置監聽器：當點選頁碼
paginator.addEventListener('click', function onPaginatorClicked(event) {
  // 如果點擊的不是<a>標籤，函式到此結束
  if (event.target.tagName !== 'A') return
  // 找到被點擊的頁數
  const page = Number(event.target.dataset.page)
  currentPage = page
  // 重新渲染網頁畫面，使用該頁的資料來選染
  renderMovieList(getMoviesByPage(currentPage))
})

// 最原始的畫面：透過API取得所有電影資料 
axios.get(INDEX_URL).then(response => {
  // 將所有電影資料放進 movies 陣列裡
  // 方法一：
  // for (const movie of response.data.results) {
  //   movies.push(movie)
  // }
  // 方法二：
  movies.push(...response.data.results)
  // 渲染分頁器與電影清單畫面
  renderPaginator(movies.length)
  renderMovieList(getMoviesByPage(currentPage))
})
  .catch(error => { console.log(error) })                
