#[tokio::main]
async fn main()->Result<(),Box<dyn std::error::Error>> {
    let db=straw_engine::db::DbState::open("sovereign.db").map_err(std::io::Error::other)?;
    let security=straw_security::Security::open(db.storage().clone(),"sovereign-checkpoint.json".into()).map_err(std::io::Error::other)?;
    if security.status().map_err(std::io::Error::other)?.quarantined {
        return Err("ledger quarantine: restore a matching trusted database/checkpoint pair".into());
    }
    let listener=axum_loop::bind().await?;
    let (_shutdown,signal)=tokio::sync::oneshot::channel();
    axum_loop::serve(listener,db,signal).await?;
    Ok(())
}
