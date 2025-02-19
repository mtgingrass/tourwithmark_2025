library(tidyverse)

# Define YouTube Playlist URL
playlist_url <- "https://www.youtube.com/playlist?list=PLuak_bGvcWZO0Da0cDVBpDeTQPEWpuvCD"

# Run yt-dlp to get video IDs and titles
# Use --get-id and --get-title together
playlist_info <- system(glue::glue("yt-dlp --flat-playlist --get-id --get-title '{playlist_url}'"), intern = TRUE)

# Ensure data was found
if (length(playlist_info) == 0) {
  stop("Error: No video data found. Double-check the playlist URL.")
}

# Split the output into IDs and titles
# yt-dlp outputs IDs and titles in alternating lines
video_ids <- playlist_info[seq(1, length(playlist_info), 2)]  # Odd lines are IDs
video_titles <- playlist_info[seq(2, length(playlist_info), 2)]  # Even lines are titles

# Ensure video IDs and titles are aligned
if (length(video_ids) != length(video_titles)) {
  stop("Error: Mismatch between video IDs and titles.")
}

# Generate Markdown embed codes with titles
markdown_output <- paste0(
  "## ", video_titles, "\n\n",  # Add a header for each video title
  "{{< video https://www.youtube.com/embed/", video_ids, " >}}\n\n",  # Video embed
  "---\n"  # Add a horizontal rule for separation
)

# Print markdown_output to confirm it contains data
cat(markdown_output, sep = "\n")

# Save to a Markdown file
output_file <- "cradletograver_playlist.md"
writeLines(markdown_output, output_file)

# Confirm the file was written
if (file.exists(output_file)) {
  cat("File written successfully:", output_file, "\n")
  cat("File contents:\n")
  cat(readLines(output_file), sep = "\n")
} else {
  stop("Error: File was not written. Check permissions or working directory.")
}