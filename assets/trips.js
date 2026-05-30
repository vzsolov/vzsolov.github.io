/* Trip data extracted from vzsolov.github.io repo.
   img/page paths are the repo-relative paths; BASE points at the live site so
   real photos render here. To deploy back into the repo, set BASE = "" and the
   relative paths work as-is. */
const BASE = "https://vzsolov.github.io/";

const TRIPS = [
  { year: 2024, title: "Czechia",    country: "Czechia",     region: "Central Europe", page: "czechia24.html",   img: "2024/czechia/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/manage/videos/962269643" }] },
  { year: 2024, title: "Cyprus",     country: "Cyprus",      region: "Mediterranean",  page: "cyprus24.html",    img: "2024/cyprus/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/manage/videos/1011647508" }] },
  { year: 2024, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece24.html",    img: "2024/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/manage/videos/1030310873" }] },

  { year: 2023, title: "Holland",    country: "Netherlands", region: "Western Europe", page: "holland23.html",   img: "2023/holland/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/832892370" }] },
  { year: 2023, title: "Corfu",      country: "Greece",      region: "Ionian Sea",     page: "corfu23.html",     img: "2023/corfu/images/image1.jpg",     links: [{ label: "Film", url: "https://vimeo.com/851624284" }] },
  { year: 2023, title: "Romania",    country: "Romania",     region: "Carpathians",    page: "romania23.html",   img: "2023/romania/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/888736331" }] },

  { year: 2022, title: "Austria",    country: "Austria",     region: "The Alps",       page: "austira22.html",   img: "2022/austria/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/721761838" }] },
  { year: 2022, title: "Iceland",    country: "Iceland",     region: "North Atlantic", page: "iceland22.html",   img: "2022/iceland/images/image00.jpg",  links: [{ label: "Film", url: "https://vimeo.com/779704019" }] },

  { year: 2020, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece20.html",    img: "2020/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/493867577" }] },

  { year: 2019, title: "Rhône-Alpes",country: "France",      region: "The Alps",       page: "france19.html",    img: "2019/france/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/341654092" }] },
  { year: 2019, title: "Greece",     country: "Greece",      region: "Mediterranean",  page: "greece19.html",    img: "2019/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/380936248" }] },

  { year: 2018, title: "Austria",    country: "Austria",     region: "The Alps",       page: "austira18.html",   img: "2018/austria/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/269239501" }] },
  { year: 2018, title: "Montenegro", country: "Montenegro",  region: "Adriatic",       page: "montenegro18.html",img: "2018/montenegro/images/image1.jpg",links: [{ label: "Film", url: "https://vimeo.com/295442862" }] },

  { year: 2017, title: "Crete",      country: "Greece",      region: "Mediterranean",  page: "greece17.html",    img: "2017/greece/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/229401853" }] },
  { year: 2017, title: "Lapland",    country: "Finland",     region: "The Arctic",     page: "lapland17.html",   img: "2017/lapland/images/image2.jpg",    links: [{ label: "Film", url: "https://vimeo.com/208193648" }] },

  { year: 2016, title: "Thailand",   country: "Thailand",    region: "Southeast Asia", page: "thailand16.html",  img: "2016/thailand/images/image1.jpg",  links: [{ label: "Film", url: "https://vimeo.com/192307301" }] },

  { year: 2015, title: "Georgia",    country: "Georgia",     region: "The Caucasus",   page: "georgia15.html",   img: "2015/georgia/images/image1.jpg",   links: [{ label: "Nature", url: "https://vimeo.com/218836340" }, { label: "Follow Me", url: "https://vimeo.com/180413605" }] },

  { year: 2014, title: "Iceland",    country: "Iceland",     region: "North Atlantic", page: "iceland14.html",   img: "2014/iceland/images/image1.jpg",   links: [{ label: "Nature", url: "https://vimeo.com/196623783" }, { label: "360°", url: "https://vimeo.com/102657979" }] },

  { year: 2013, title: "Norway",     country: "Norway",      region: "The Fjords",     page: "norway13.html",    img: "2013/norway/images/image1.jpg",    links: [{ label: "Film", url: "https://vimeo.com/200458098" }] },

  { year: 2012, title: "Ireland",    country: "Ireland",     region: "Atlantic Coast", page: "ireland12.html",   img: "2012/ireland/images/image1.jpg",   links: [{ label: "Film", url: "https://vimeo.com/199864810" }] },
  { year: 2012, title: "Prague",     country: "Czechia",     region: "Central Europe", page: "praga12.html",     img: "2012/praga/images/image1.jpg",     links: [] },
];

const COUNTRIES = [...new Set(TRIPS.map(t => t.country))];
const YEARS = [...new Set(TRIPS.map(t => t.year))].sort((a, b) => b - a);
const STATS = {
  trips: TRIPS.length,
  countries: COUNTRIES.length,
  yearsFrom: Math.min(...TRIPS.map(t => t.year)),
  yearsTo: Math.max(...TRIPS.map(t => t.year)),
  continents: 2, // Europe + Asia (Thailand)
};

/* Rough lon/lat for the map feature, one marker per country. */
const PLACES = [
  { country: "Iceland",     lat: 64.9,  lon: -19.0 },
  { country: "Ireland",     lat: 53.1,  lon: -8.2  },
  { country: "Netherlands", lat: 52.2,  lon: 5.3   },
  { country: "Norway",      lat: 61.0,  lon: 8.5   },
  { country: "Finland",     lat: 67.9,  lon: 26.5  },
  { country: "France",      lat: 45.5,  lon: 6.2   },
  { country: "Austria",     lat: 47.4,  lon: 13.3  },
  { country: "Czechia",     lat: 49.8,  lon: 15.0  },
  { country: "Romania",     lat: 45.9,  lon: 25.0  },
  { country: "Montenegro",  lat: 42.7,  lon: 19.3  },
  { country: "Greece",      lat: 39.0,  lon: 22.5  },
  { country: "Cyprus",      lat: 35.0,  lon: 33.2  },
  { country: "Georgia",     lat: 42.2,  lon: 43.4  },
  { country: "Thailand",    lat: 15.0,  lon: 101.0 },
];
