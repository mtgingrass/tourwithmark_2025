library(tidyverse)

# Define YouTube Playlist URL
playlist_url <- "https://www.youtube.com/playlist?list=PLuak_bGvcWZO0Da0cDVBpDeTQPEWpuvCD"

# Define the file to store video IDs
video_ids_file <- "video_ids.txt"

# Run yt-dlp in R to get video IDs
system(glue::glue("yt-dlp --flat-playlist --get-id '{playlist_url}' > {video_ids_file}"))

# Read extracted video IDs
if (file.exists(video_ids_file)) {
  video_ids <- readLines(video_ids_file)
} else {
  stop("Error: No video IDs found. Check if yt-dlp is installed and working.")
}

# Ensure video IDs were found
if (length(video_ids) == 0) {
  stop("Error: No video IDs found. Double-check the playlist URL.")
}

# Generate Markdown embed codes for Quarto
markdown_output <- paste0("{{< video https://www.youtube.com/embed/", video_ids, " >}}")

# Save to a Markdown file
output_file <- "cradletograver_playlist.md"
writeLines(markdown_output, output_file)

# Print success message
cat("Markdown file generated successfully! Check:", output_file, "\n")

# Print output to console
print(markdown_output)