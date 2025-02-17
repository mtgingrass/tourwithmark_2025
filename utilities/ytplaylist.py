from pytube import Playlist

# Replace with your playlist URL
playlist_url = "https://www.youtube.com/playlist?list=PLuak_bGvcWZO0Da0cDVBpDeTQPEWpuvCD"
playlist = Playlist(playlist_url)

# Ensure the playlist loads properly
if not playlist.video_urls:
    print("Error: No videos found in the playlist. Double-check the URL.")
    exit(1)

# Generate Markdown embed codes
with open("cradletograver_playlist.md", "w") as file:
    for url in playlist.video_urls:
        video_id = url.split("v=")[-1]
        embed_code = f"{{{{< video https://www.youtube.com/embed/{video_id} >}}}}\n"
        print(embed_code)  # Print output to terminal
        file.write(embed_code)  # Save to playlist.md
