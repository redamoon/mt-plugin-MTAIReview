package MT::Plugin::MTAIReview;

use strict;
use warnings;
use utf8;
use MT;
use MT::Plugin;
use base qw(MT::Plugin);
use JSON;
use LWP::UserAgent;
use Encode;
use MIME::Base64;

sub init {
    my $plugin = shift;
    $plugin->SUPER::init(@_);
    $plugin->{config_template} = 'config.tmpl';
    
    # プラグイン登録前のログ
    MT->log({ 
        message => "MTAIReview: MT::Plugin::MTAIReview::init が呼び出されました",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    
    # プラグイン登録後の確認
    my $registered_plugin = MT->component('MTAIReview');
    if ($registered_plugin) {
        MT->log({ 
            message => "MTAIReview: プラグインが正常に登録されました (key: " . ($registered_plugin->key || 'unknown') . ")",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        
        # コールバックの登録状況を確認
        my $callbacks = $registered_plugin->registry('callbacks');
        if ($callbacks) {
            my @callback_names = keys %$callbacks;
            MT->log({ 
                message => "MTAIReview: 登録されているコールバック: " . join(", ", @callback_names),
                level => MT::Log::INFO(),
                class => 'system',
                category => 'plugin'
            });
            
            # 主要なコールバックの存在確認
            for my $cb_name (qw(template_source.edit_entry template_param.edit_entry template_source.edit_content_data template_param.edit_content_data)) {
                if (exists $callbacks->{$cb_name}) {
                    MT->log({ 
                        message => "MTAIReview: コールバック '$cb_name' が登録されています: " . $callbacks->{$cb_name},
                        level => MT::Log::INFO(),
                        class => 'system',
                        category => 'plugin'
                    });
                } else {
                    MT->log({ 
                        message => "MTAIReview: コールバック '$cb_name' が登録されていません",
                        level => MT::Log::WARNING(),
                        class => 'system',
                        category => 'plugin'
                    });
                }
            }
        } else {
            MT->log({ 
                message => "MTAIReview: コールバックが登録されていません",
                level => MT::Log::WARNING(),
                class => 'system',
                category => 'plugin'
            });
        }
    } else {
        MT->log({ 
            message => "MTAIReview: プラグインの登録に失敗しました",
            level => MT::Log::ERROR(),
            class => 'system',
            category => 'plugin'
        });
    }
    
    return $plugin;
}

# -------------------------------
# 設定画面テンプレートの指定
# -------------------------------
sub config_template {
    return 'config.tmpl';
}

# -------------------------------
# 編集画面にAIレビューJS挿入（template_source）
# -------------------------------
sub add_ai_review_button {
    my ($cb, $app, $tmpl_ref) = @_;

    # デバッグ用：コールバックが呼び出されたことを確認
    MT->log({ 
        message => "MTAIReview: add_ai_review_button コールバックが呼び出されました",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });

    # プラグインオブジェクトを取得
    my $plugin = MT->component('MTAIReview');
    
    # 静的ファイルのパスを構築（MTの標準的な方法を使用）
    my $static_path;
    if ($app && $app->can('static_path')) {
        $static_path = $app->static_path;
    } elsif (MT->can('static_path')) {
        $static_path = MT->static_path;
    } else {
        $static_path = MT->config->StaticWebPath || '/cgi-bin/mt/mt-static';
    }
    
    # 末尾のスラッシュを削除してから追加
    $static_path =~ s!/$!!;
    my $js_path = $static_path . '/plugins/MTAIReview/ai_review.js';
    
    MT->log({ 
        message => "MTAIReview: JavaScriptパス: $js_path (static_path: $static_path, app->static_path: " . ($app && $app->can('static_path') ? $app->static_path : 'N/A') . ", MT->static_path: " . (MT->can('static_path') ? MT->static_path : 'N/A') . ", StaticWebPath: " . (MT->config->StaticWebPath || 'N/A') . ")",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    
    # 直接<script>タグを挿入
    my $injection = qq{<script type="text/javascript" src="$js_path"></script>\n};

    # 方法1: <mt:setvarblock name="js_include" append="1">ブロックの中に追加（最も確実）
    if ($$tmpl_ref =~ s/(<mt:setvarblock\s+name=["']js_include["']\s+append=["']1["']>)/$1\n$injection/i) {
        MT->log({ 
            message => "MTAIReview: js_include setvarblockの中にスクリプトを追加しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法2: 既存のjs_include setvarblockの閉じタグの前に追加
    if ($$tmpl_ref =~ s/(<\/mt:setvarblock>\s*(?:<!--.*?-->)?\s*<mt:var\s+name=["']js_include["']>)/$injection$1/is) {
        MT->log({ 
            message => "MTAIReview: js_include setvarblockの閉じタグの前にスクリプトを追加しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法3: <mt:var name="js_include">の直前に追加
    if ($$tmpl_ref =~ s/(<mt:var\s+name=["']js_include["']>)/$injection$1/i) {
        MT->log({ 
            message => "MTAIReview: js_include変数の直前にスクリプトを追加しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法4: </body>タグの前に挿入
    if ($$tmpl_ref =~ s/(<\/body>)/$injection$1/i) {
        MT->log({ 
            message => "MTAIReview: </body>の前にスクリプトを追加しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法5: </head>の前に挿入
    if ($$tmpl_ref =~ s/(<\/head>)/$injection$1/i) {
        MT->log({ 
            message => "MTAIReview: </head>の前にスクリプトを挿入しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法6: 既存の<script>タグの後に追加
    if ($$tmpl_ref =~ s/(<\/script>)/$1\n$injection/i) {
        MT->log({ 
            message => "MTAIReview: 既存のscriptタグの後にスクリプトを追加しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
        return 1;
    }
    # 方法7: 最後に追加
    $$tmpl_ref .= $injection;
    MT->log({ 
        message => "MTAIReview: テンプレートの最後にスクリプトを追加しました",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    return 1;
}

# -------------------------------
# 編集画面にAIレビューJS挿入（template_param）
# MTBlockEditorの方法を参考に、テンプレートファイルを挿入
# -------------------------------
sub add_ai_review_button_param {
    my ($cb, $app, $param, $tmpl) = @_;

    # デバッグ用：コールバックが呼び出されたことを確認
    MT->log({ 
        message => "MTAIReview: add_ai_review_button_param コールバックが呼び出されました (mode: " . ($app->mode || 'unknown') . ", id: " . ($app->id || 'unknown') . ")",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });

    # プラグインオブジェクトを取得
    my $plugin = MT->component('MTAIReview');
    unless ($plugin) {
        MT->log({ 
            message => "MTAIReview: プラグインオブジェクトが取得できませんでした",
            level => MT::Log::WARNING(),
            class => 'system',
            category => 'plugin'
        });
        return;
    }
    
    # static_uriパラメータを設定（テンプレートで使用するため）
    # MTの標準的な方法で静的ファイルのパスを取得
    my $static_uri;
    if ($app && $app->can('static_path')) {
        $static_uri = $app->static_path;
    } elsif (MT->can('static_path')) {
        $static_uri = MT->static_path;
    } else {
        $static_uri = MT->config->StaticWebPath || '/cgi-bin/mt/mt-static';
    }
    
    # 末尾のスラッシュを確実に付ける
    $static_uri =~ s!/$!!;
    $static_uri .= '/';
    
    MT->log({ 
        message => "MTAIReview: static_uriを設定しました: $static_uri (app->static_path: " . ($app && $app->can('static_path') ? $app->static_path : 'N/A') . ", MT->static_path: " . (MT->can('static_path') ? MT->static_path : 'N/A') . ", StaticWebPath: " . (MT->config->StaticWebPath || 'N/A') . ")",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    
    # js_includeパラメータに直接スクリプトタグを追加
    my $js_path = $static_uri . 'plugins/MTAIReview/ai_review.js';
    my $script_tag = qq{<script type="text/javascript" src="$js_path"></script>\n};
    
    MT->log({ 
        message => "MTAIReview: スクリプトタグを生成しました: $js_path",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    
    # js_includeパラメータが存在する場合は追加、存在しない場合は新規作成
    if (exists $param->{js_include} && defined $param->{js_include}) {
        $param->{js_include} .= $script_tag;
        MT->log({ 
            message => "MTAIReview: js_includeパラメータに追加しました（既存値あり、長さ: " . length($param->{js_include}) . "文字）",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
    } else {
        $param->{js_include} = $script_tag;
        MT->log({ 
            message => "MTAIReview: js_includeパラメータを新規作成しました",
            level => MT::Log::INFO(),
            class => 'system',
            category => 'plugin'
        });
    }
    
    # カスタムプロンプト設定をJavaScriptに渡す
    my $custom_prompts = $plugin->get_config_value('custom_prompts') || '';
    my $prompts_json = '';
    if ($custom_prompts) {
        # 設定値がUTF-8バイト列の場合はUTF-8フラグ付き文字列に変換
        unless (utf8::is_utf8($custom_prompts)) {
            $custom_prompts = Encode::decode_utf8($custom_prompts);
        }
        
        my @prompts = grep { $_ =~ /\S/ } split(/\n/, $custom_prompts);
        if (@prompts) {
            # プロンプトをUTF-8フラグ付きに統一してからJSONエンコード
            @prompts = map { 
                my $p = $_;
                # UTF-8フラグがない場合はUTF-8としてデコード
                unless (utf8::is_utf8($p)) {
                    $p = Encode::decode_utf8($p);
                }
                $p;
            } @prompts;
            
            # JSONエンコード（Unicodeエスケープシーケンスを使用）
            my $json = JSON->new;
            $json->utf8(0);  # Unicodeエスケープシーケンス（\uXXXX）を使用
            $json->pretty(0);
            $json->ascii(1);  # ASCII以外の文字をエスケープ
            my $json_str = $json->encode(\@prompts);
            
            MT->log({ 
                message => "MTAIReview: カスタムプロンプトを設定しました（件数: " . scalar(@prompts) . ", JSON長: " . length($json_str) . "）",
                level => MT::Log::INFO(),
                class => 'system',
                category => 'plugin'
            });
            
            # JSON文字列をそのまま埋め込む（Unicodeエスケープシーケンスが使用されているため、ブラウザで正しく解釈される）
            my $prompts_script = qq{<script type="text/javascript">\n  if (typeof window.MTAIReviewPrompts === 'undefined') { try { window.MTAIReviewPrompts = $json_str; } catch(e) { console.error('MTAIReview: プロンプト設定の読み込みエラー:', e); window.MTAIReviewPrompts = []; } }\n</script>\n};
            $param->{js_include} .= $prompts_script;
        }
    }
    
    MT->log({ 
        message => "MTAIReview: js_includeパラメータにスクリプトを追加しました: $js_path",
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
}

# -------------------------------
# JSONエラーレスポンスを返すヘルパー
# -------------------------------
sub json_error {
    my ($app, $error_msg) = @_;
    $app->{no_print_body} = 1;  # MTのテンプレート出力を無効化
    $app->send_http_header('application/json; charset=utf-8');
    
    # UTF-8フラグ付きのPerl文字列に変換
    my $utf8_error_msg = $error_msg;
    unless (utf8::is_utf8($utf8_error_msg)) {
        $utf8_error_msg = Encode::decode_utf8($utf8_error_msg);
    }
    
    # JSONエンコード（UTF-8フラグなしのバイト列として出力）
    # utf8(0)を使用することで、UTF-8バイト列として直接エンコードされる
    my $json = JSON->new->utf8(0)->ascii(0);
    my $json_str = $json->encode({ error => $utf8_error_msg });
    
    # UTF-8バイト列として出力（utf8(0)でエンコードされた結果は既にUTF-8バイト列）
    print $json_str;
    return;
}

# -------------------------------
# JSON成功レスポンスを返すヘルパー
# -------------------------------
sub json_result {
    my ($app, $data) = @_;
    $app->{no_print_body} = 1;  # MTのテンプレート出力を無効化
    $app->send_http_header('application/json; charset=utf-8');
    
    # データ構造内の文字列をUTF-8フラグ付きに変換
    my $utf8_data = _ensure_utf8($data);
    
    # JSONエンコード（UTF-8フラグなしのバイト列として出力）
    # utf8(0)を使用することで、UTF-8バイト列として直接エンコードされる
    my $json = JSON->new->utf8(0)->ascii(0);
    my $json_str = $json->encode($utf8_data);
    
    # UTF-8バイト列として出力（utf8(0)でエンコードされた結果は既にUTF-8バイト列）
    print $json_str;
    return;
}

# -------------------------------
# データ構造内の文字列をUTF-8フラグ付きに変換するヘルパー
# -------------------------------
sub _ensure_utf8 {
    my ($data) = @_;
    
    if (ref $data eq 'HASH') {
        my %utf8_hash;
        for my $key (keys %$data) {
            my $utf8_key = Encode::decode_utf8(Encode::encode_utf8($key));
            if (ref $data->{$key}) {
                $utf8_hash{$utf8_key} = _ensure_utf8($data->{$key});
            } else {
                my $value = $data->{$key};
                $utf8_hash{$utf8_key} = Encode::decode_utf8(Encode::encode_utf8($value));
            }
        }
        return \%utf8_hash;
    } elsif (ref $data eq 'ARRAY') {
        return [ map { ref $_ ? _ensure_utf8($_) : Encode::decode_utf8(Encode::encode_utf8($_)) } @$data ];
    } else {
        return Encode::decode_utf8(Encode::encode_utf8($data));
    }
}

# -------------------------------
# GeminiでAIレビュー実行
# -------------------------------
sub ai_review {
    my ($app) = @_;
    
    # 認証チェック
    return json_error($app, "認証が必要です。") unless $app->user;
    
    my $q = $app->param;
    my $component = MT->component('MTAIReview');
    my $api_key = $component->get_config_value('gemini_api_key');
    
    # APIキーチェック
    unless ($api_key) {
        return json_error($app, "Gemini APIキーが設定されていません。プラグイン設定でAPIキーを設定してください。");
    }
    
    my $prompt = $q->param('prompt') || 'このコンテンツをレビューしてください。';
    
    # デバッグ: 受信したパラメータをログに記録
    my $selected_text = $q->param('selected_text') || '';
    my $contents_json = $q->param('contents') || '';
    my $combined_content = $q->param('combined_content') || '';
    my $title = $q->param('title') || '';
    my $body  = $q->param('body') || '';
    
    MT->log({ 
        message => "MTAIReview: 受信パラメータ - selected_text: " . (length($selected_text) ? "あり(" . length($selected_text) . "文字)" : "なし") . 
                   ", contents_json: " . (length($contents_json) ? "あり(" . length($contents_json) . "文字)" : "なし") .
                   ", combined_content: " . (length($combined_content) ? "あり(" . length($combined_content) . "文字)" : "なし") .
                   ", title: " . (length($title) ? "あり(" . length($title) . "文字)" : "なし") .
                   ", body: " . (length($body) ? "あり(" . length($body) . "文字)" : "なし"),
        level => MT::Log::INFO(),
        class => 'system',
        category => 'plugin'
    });
    
    # 選択されたテキストがある場合（優先）
    if ($selected_text) {
        my $content = "選択されたテキスト:\n$selected_text";
        return call_gemini_api($app, $api_key, $content, $prompt);
    }
    
    # 複数のフィールドが指定されている場合
    if ($contents_json) {
        my $contents;
        eval {
            # UTF-8フラグを外してからJSONパース（Wide characterエラーを防ぐため）
            my $json_str = $contents_json;
            # UTF-8フラグ付きの場合は、UTF-8バイト列にエンコード（UTF-8フラグは自動的に外れる）
            if (utf8::is_utf8($json_str)) {
                $json_str = Encode::encode_utf8($json_str);
            }
            # JSON->new->utf8(0)を使用して、UTF-8フラグなしでパース
            my $json = JSON->new->utf8(0);
            $contents = $json->decode($json_str);
        };
        
        if ($@) {
            my $error_msg = $@;
            # エラーメッセージからUTF-8フラグを外してログに記録
            $error_msg = Encode::encode_utf8($error_msg) if utf8::is_utf8($error_msg);
            MT->log({ 
                message => "MTAIReview: JSONパースエラー: $error_msg",
                level => MT::Log::WARNING(),
                class => 'system',
                category => 'plugin'
            });
        }
        
        if ($@ || !$contents || !ref($contents) || ref($contents) ne 'ARRAY') {
            # JSONパース失敗の場合、combined_contentを優先的に使用
            if ($combined_content && $combined_content =~ /\S/) {
                MT->log({ 
                    message => "MTAIReview: JSONパース失敗のため、combined_contentを使用します",
                    level => MT::Log::INFO(),
                    class => 'system',
                    category => 'plugin'
                });
                return call_gemini_api($app, $api_key, $combined_content, $prompt);
            }
            
            # combined_contentもない場合、後方互換性のためにtitle/bodyを確認
            unless ($title || $body) {
                MT->log({ 
                    message => "MTAIReview: コンテンツが存在しません（JSONパース失敗でcombined_content/title/bodyもなし）",
                    level => MT::Log::WARNING(),
                    class => 'system',
                    category => 'plugin'
                });
                return json_error($app, "レビュー対象のコンテンツがありません。");
            }
            
            my $content = '';
            $content .= "タイトル: $title\n" if $title;
            $content .= "本文: $body\n" if $body;
            
            return call_gemini_api($app, $api_key, $content, $prompt);
        }
        
        # 複数フィールドの内容を構築
        my $content = '';
        foreach my $field (@$contents) {
            my $label = $field->{label} || $field->{name} || 'フィールド';
            my $value = $field->{value} || '';
            if ($value && $value =~ /\S/) {  # 空白以外の文字が含まれているかチェック
                $content .= "$label:\n$value\n\n---\n\n";
            }
        }
        
        unless ($content) {
            MT->log({ 
                message => "MTAIReview: 選択されたフィールドにコンテンツがありません（contents配列の要素数: " . scalar(@$contents) . "）",
                level => MT::Log::WARNING(),
                class => 'system',
                category => 'plugin'
            });
            return json_error($app, "選択されたフィールドにコンテンツがありません。");
        }
        
        return call_gemini_api($app, $api_key, $content, $prompt);
    }
    
    # combined_contentが指定されている場合
    if ($combined_content && $combined_content =~ /\S/) {  # 空白以外の文字が含まれているかチェック
        return call_gemini_api($app, $api_key, $combined_content, $prompt);
    }
    
    # 後方互換性: title/bodyパラメータ
    unless ($title || $body) {
        MT->log({ 
            message => "MTAIReview: コンテンツが存在しません（すべてのパラメータが空）",
            level => MT::Log::WARNING(),
            class => 'system',
            category => 'plugin'
        });
        return json_error($app, "レビュー対象のコンテンツがありません。");
    }
    
    my $content = '';
    $content .= "タイトル: $title\n" if $title;
    $content .= "本文: $body\n" if $body;
    
    return call_gemini_api($app, $api_key, $content, $prompt);
    
}

# -------------------------------
# Gemini API呼び出し（共通処理）
# -------------------------------
sub call_gemini_api {
    my ($app, $api_key, $content, $prompt) = @_;
    
    # Gemini API呼び出し
    # 利用可能なモデル名のリスト（優先順位順）
    # 最新のモデル: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite
    # 参考: https://ai.google.dev/gemini-api/docs?hl=ja
    my @models = ('gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro');
    my $api_version = 'v1beta';
    
    my $ua = LWP::UserAgent->new;
    $ua->timeout(30);
    
    my $request_body = {
        contents => [{
            parts => [
                { text => "あなたは優秀な編集者です。次のコンテンツをレビューし、改善案や助言を出してください。" },
                { text => "ユーザーの指示: $prompt" },
                { text => $content },
            ],
        }],
    };
    
    my $last_error;
    foreach my $model (@models) {
        # APIエンドポイント（クエリパラメータまたはヘッダーでAPIキーを指定）
        my $url = "https://generativelanguage.googleapis.com/$api_version/models/$model:generateContent?key=$api_key";
        
        MT->log({ message => "MTAIReview: Gemini API呼び出しを試行中: $model" });
        
        # JSONエンコード（UTF-8フラグ付き文字列を安全に処理）
        my $json_encoder = JSON->new->utf8(1);
        my $request_json = $json_encoder->encode($request_body);
        
        my $res = $ua->post(
            $url,
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $api_key,  # ヘッダーでもAPIキーを指定（より安全）
            Content => $request_json,
        );
        
        if ($res->is_success) {
            my $data;
            eval {
                # JSONデコード（UTF-8フラグなしバイト列を処理）
                my $json_decoder = JSON->new->utf8(0);
                $data = $json_decoder->decode($res->decoded_content);
            };
            
            if ($@) {
                my $error_msg = "Gemini APIレスポンスのJSON解析に失敗しました: $@";
                MT->log({ message => "MTAIReview: $error_msg" });
                return json_error($app, $error_msg);
            }
            
            # デバッグ: レスポンス構造をログに記録
            MT->log({ message => "MTAIReview: Gemini API呼び出し成功: $model" });
            
            # レスポンス構造の確認
            my $output;
            if (exists $data->{candidates} && 
                ref $data->{candidates} eq 'ARRAY' && 
                @{$data->{candidates}} > 0 &&
                exists $data->{candidates}->[0]->{content}->{parts} &&
                ref $data->{candidates}->[0]->{content}->{parts} eq 'ARRAY' &&
                @{$data->{candidates}->[0]->{content}->{parts}} > 0) {
                
                $output = $data->{candidates}->[0]->{content}->{parts}->[0]->{text};
            } elsif (exists $data->{text}) {
                # 直接textフィールドがある場合
                $output = $data->{text};
            } elsif (exists $data->{candidates} && 
                     ref $data->{candidates} eq 'ARRAY' && 
                     @{$data->{candidates}} > 0 &&
                     exists $data->{candidates}->[0]->{text}) {
                # candidates[0].textがある場合
                $output = $data->{candidates}->[0]->{text};
            }
            
            if ($output) {
                # UTF-8フラグが付いていない場合はUTF-8としてデコード
                unless (utf8::is_utf8($output)) {
                    $output = Encode::decode_utf8($output);
                }
                MT->log({ message => "MTAIReview: Gemini API呼び出し成功: $model (出力長: " . length($output) . "文字)" });
                return json_result($app, { review => $output });
            } else {
                my $error_detail = "Gemini APIからの応答形式が正しくありません。";
                $error_detail .= " レスポンス構造: " . (ref $data ? "HASH" : "SCALAR");
                if (ref $data eq 'HASH') {
                    $error_detail .= " キー: " . join(", ", keys %$data);
                    # デバッグ用にレスポンス全体をログに記録
                    my $log_json = JSON->new->utf8(1)->encode($data);
                    MT->log({ message => "MTAIReview: レスポンス内容: " . $log_json });
                }
                MT->log({ message => "MTAIReview: $error_detail" });
                return json_error($app, $error_detail);
            }
        } else {
            # 404エラーの場合、次のモデルを試す
            my $error_data;
            if ($res->decoded_content) {
                eval {
                    my $json_decoder = JSON->new->utf8(0);
                    $error_data = $json_decoder->decode($res->decoded_content);
                };
            }
            
            my $error_msg = "Gemini API呼び出し失敗 ($model): " . $res->status_line;
            if ($error_data && exists $error_data->{error}) {
                $error_msg .= " - " . $error_data->{error}->{message};
            }
            
            $last_error = $error_msg;
            MT->log({ message => "MTAIReview: $error_msg" });
            
            # 404エラーで、まだ試すモデルがある場合は続行
            my $last_model = $models[$#models];
            if ($res->code == 404 && $model ne $last_model) {
                next;
            } else {
                # 最後のモデルでも失敗した場合、または404以外のエラーの場合
                return json_error($app, $error_msg);
            }
        }
    }
    
    # すべてのモデルで失敗した場合
    return json_error($app, $last_error || "Gemini API呼び出しに失敗しました。");
}

# プラグインオブジェクトを返す
sub plugin {
    return MT->component('MTAIReview');
}

1;
