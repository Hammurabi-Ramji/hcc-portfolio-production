use crate::{ApiError, ApiResult};
use std::{
    env,
    net::{Ipv4Addr, SocketAddr},
    path::PathBuf,
};

#[derive(Debug, Clone)]
pub struct Config {
    pub web_origin: String,
    pub port: u16,
    pub database: PathBuf,
    pub secure_cookie: bool,
}
impl Config {
    pub fn new(web_origin: &str, port: u16, database: PathBuf) -> ApiResult<Self> {
        let url = url::Url::parse(web_origin).map_err(|_| ApiError::invalid())?;
        if !matches!(url.scheme(), "http" | "https")
            || !matches!(url.host_str(), Some("localhost" | "127.0.0.1"))
            || !url.username().is_empty()
            || url.password().is_some()
            || url.path() != "/"
            || url.query().is_some()
            || url.fragment().is_some()
            || port == 0
        {
            return Err(ApiError::invalid());
        }
        Ok(Self {
            web_origin: url.origin().ascii_serialization(),
            port,
            database,
            secure_cookie: url.scheme() == "https",
        })
    }
    pub fn from_env() -> ApiResult<Self> {
        let origin =
            env::var("STRAW_WEB_ORIGIN").unwrap_or_else(|_| "http://localhost:3000".into());
        let raw_port = env::var("STRAW_API_PORT").unwrap_or_else(|_| "3001".into());
        if raw_port.is_empty() || !raw_port.bytes().all(|b| b.is_ascii_digit()) {
            return Err(ApiError::invalid());
        }
        let port = raw_port.parse::<u16>().map_err(|_| ApiError::invalid())?;
        let database = env::var_os("STRAW_API_DATABASE")
            .map(PathBuf::from)
            .unwrap_or_else(|| PathBuf::from("straw-web.sqlite3"));
        Self::new(&origin, port, database)
    }
    pub fn address(&self) -> SocketAddr {
        SocketAddr::from((Ipv4Addr::LOCALHOST, self.port))
    }
}
