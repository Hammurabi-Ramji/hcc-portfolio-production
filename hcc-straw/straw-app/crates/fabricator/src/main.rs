fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut args = std::env::args().skip(1);
    match args.next().as_deref() {
        Some("list") => {
            for name in straw_fabricator::TEMPLATES {
                println!("{name}");
            }
        }
        Some("generate") => {
            let template = args.next().ok_or("missing template")?;
            let directory = args.next().ok_or("missing output directory")?;
            if args.next().is_some() {
                return Err("unexpected argument".into());
            }
            println!(
                "{}",
                serde_json::to_string_pretty(
                    &straw_fabricator::generate(&template, std::path::Path::new(&directory))
                        .map_err(std::io::Error::other)?
                )?
            );
        }
        _ => return Err("usage: straw-fabricator list | generate TEMPLATE DIRECTORY".into()),
    }
    Ok(())
}
